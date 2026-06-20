from typing import List

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.logger import logger
from app.core.exceptions import ConsultationNotFoundException, PatientNotOwnedException
from app.models.consultation import Consultation, ConsultationStatus
from app.models.patient import Patient
from app.models.soap_note import SOAPNote


class ConsultationService:

    @staticmethod
    async def create_consultation(
        db: AsyncSession, doctor_id, patient_id
    ) -> Consultation:
        # First verify this patient actually belongs to this doctor
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.deleted_at.is_(None)
        )
        patient = await db.scalar(stmt)

        if not patient:
            raise PatientNotOwnedException()
        if patient.doctor_id != doctor_id:
            raise PatientNotOwnedException()

        consultation = Consultation(
            patient_id=patient_id,
            doctor_id=doctor_id,
            status=ConsultationStatus.PENDING,
        )
        db.add(consultation)
        await db.commit()
        
        # Re-fetch to ensure relationships (like soap_note) are eager loaded
        stmt = select(Consultation).where(Consultation.id == consultation.id).options(
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses)
        )
        consultation = await db.scalar(stmt)

        logger.info(f"Created consultation {consultation.id} for patient {patient_id}")
        return consultation

    @staticmethod
    async def get_consultations_for_patient(
        db: AsyncSession, doctor_id, patient_id
    ) -> List[Consultation]:
        stmt = select(Consultation).where(
            Consultation.patient_id == patient_id,
            Consultation.doctor_id == doctor_id,
            Consultation.deleted_at.is_(None),
        ).order_by(Consultation.created_at.desc()).options(
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses)
        )

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_consultation_by_id(
        db: AsyncSession, doctor_id, consultation_id
    ) -> Consultation:
        stmt = select(Consultation).where(
            Consultation.id == consultation_id,
            Consultation.doctor_id == doctor_id,
        ).options(
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses)
        )
        consultation = await db.scalar(stmt)
        if not consultation:
            raise ConsultationNotFoundException()
        return consultation

    @staticmethod
    async def save_audio_and_transcribe(
        db: AsyncSession,
        consultation: Consultation,
        audio_bytes: bytes,
        background_tasks: BackgroundTasks,
    ) -> None:
        """
        Orchestrates the audio pipeline:
        1. Uploads audio to S3 via s3_service.
        2. Saves the S3 key to the consultation record.
        3. Enqueues a background task for Deepgram transcription.
        """
        from app.services.s3_service import s3_service

        s3_key = await s3_service.upload_audio(audio_bytes, str(consultation.id))

        consultation.audio_s3_key = s3_key
        await db.commit()

        background_tasks.add_task(
            _run_transcription,
            consultation_id=str(consultation.id),
            s3_key=s3_key,
        )


# ── Background Task (Runs outside the HTTP Request Lifecycle) ─────────────

async def _run_transcription(consultation_id: str, s3_key: str) -> None:
    """
    Downloads audio from S3 via s3_service and transcribes it via deepgram_service.
    Creates a SOAPNote with the raw transcript and structured SOAP data.
    """
    from app.db.session import AsyncSessionLocal
    from app.services.s3_service import s3_service
    from app.services.deepgram_service import deepgram_service
    from app.services.llm_service import llm_service
    from app.models.medication import Medication
    from app.models.diagnosis import Diagnosis

    async with AsyncSessionLocal() as db:
        # 1. Fetch the consultation and mark PROCESSING
        stmt = select(Consultation).where(Consultation.id == consultation_id)
        consultation = await db.scalar(stmt)
        if not consultation:
            logger.error(f"Consultation {consultation_id} not found in background task.")
            return

        consultation.status = ConsultationStatus.PROCESSING
        await db.commit()
        # IMPORTANT: After commit(), SQLAlchemy expires all ORM objects.
        # We must re-fetch the consultation so it is bound to the current session
        # and attribute assignments in the finally/except blocks work correctly.
        await db.refresh(consultation)

        logger.info(f"Consultation {consultation_id}: status set to PROCESSING.")

        failed = False
        error_message = ""

        try:
            # 2. Download audio from S3
            audio_bytes = await s3_service.download_audio(s3_key)
            logger.info(f"Consultation {consultation_id}: downloaded {len(audio_bytes):,} bytes from S3.")

            # 3. Transcribe with Deepgram
            result = await deepgram_service.transcribe_audio(
                audio_bytes,
                consultation_id=consultation_id,
            )
            if result.is_empty:
                raise ValueError("Deepgram returned an empty transcript. Audio may be too short or silent.")

            transcript = result.transcript
            logger.info(f"Consultation {consultation_id}: transcript length={len(transcript)} chars.")

            # 4. Extract structured SOAP data via Groq LLM
            structured_data = await llm_service.extract_structured_data(transcript)

            # 5. Save SOAPNote
            soap_note = SOAPNote(
                consultation_id=consultation_id,
                raw_transcript=transcript,
                subjective=structured_data.subjective,
                objective=structured_data.objective,
                assessment=structured_data.assessment,
                plan=structured_data.plan,
            )
            db.add(soap_note)

            # 6. Add medications
            for med in structured_data.medications:
                db.add(Medication(
                    consultation_id=consultation_id,
                    name=med.name,
                    dosage=med.dosage,
                    frequency=med.frequency,
                    duration=med.duration,
                    route=med.route,
                ))

            # 7. Add diagnoses
            for diag in structured_data.diagnoses:
                db.add(Diagnosis(
                    consultation_id=consultation_id,
                    icd_code=diag.icd_code,
                    description=diag.description,
                ))

            # 8. Mark COMPLETE — the consultation is refreshed so this is safe
            consultation.status = ConsultationStatus.COMPLETE
            await db.commit()

            logger.info(
                f"Consultation {consultation_id}: pipeline complete — status=COMPLETE."
            )

        except Exception as exc:
            logger.error(f"Transcription pipeline failed for {consultation_id}: {exc}", exc_info=True)
            failed = True
            error_message = str(exc)

        finally:
            # Always guarantee the status is persisted — even if the except
            # block itself would raise (e.g. DB temporarily unavailable).
            if failed:
                try:
                    # db.refresh() ensures the object is in the current session scope.
                    await db.refresh(consultation)
                    consultation.status = ConsultationStatus.FAILED
                    consultation.processing_error = error_message
                    await db.commit()
                    logger.info(f"Consultation {consultation_id}: status set to FAILED.")
                except Exception as commit_exc:
                    logger.error(
                        f"Could not save FAILED status for {consultation_id}: {commit_exc}"
                    )
