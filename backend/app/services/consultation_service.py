from typing import List, Tuple, Union

from fastapi import BackgroundTasks
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.logger import logger
from app.core.exceptions import ConsultationNotFoundException, PatientNotOwnedException
from app.models.consultation import Consultation, ConsultationStatus
from app.schemas.consultation import ConsultationUpdate, ConsultationResponse
from app.models.patient import Patient
from app.models.soap_note import SOAPNote

from app.models.medication import Medication
from app.models.diagnosis import Diagnosis
from app.services.cache_service import (
    cache,
    key_consultations_list,
    key_consultation,
    TTL_CONSULTATIONS,
    TTL_CONSULTATION,
)

from app.services.rag_service import rag_service


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
            selectinload(Consultation.diagnoses),
            selectinload(Consultation.interactions)
        )
        consultation = await db.scalar(stmt)

        logger.info(f"Created consultation {consultation.id} for patient {patient_id}")

        from app.services.cache_service import key_stats
        # ── Invalidate the consultations list for this patient ─────────────────
        await cache.delete(
            key_consultations_list(str(doctor_id), str(patient_id)),
            key_stats(str(doctor_id))
        )

        return consultation

    @staticmethod
    async def get_consultations_for_patient(
        db: AsyncSession, doctor_id, patient_id, page: int = 1, page_size: int = 50, return_total: bool = False
    ) -> Union[List[Consultation], Tuple[List[Consultation], int]]:
        count_stmt = select(func.count(Consultation.id)).where(
            Consultation.patient_id == patient_id,
            Consultation.doctor_id == doctor_id,
            Consultation.deleted_at.is_(None),
        )
        total_res = await db.execute(count_stmt)
        total_count = total_res.scalar() or 0

        offset = (page - 1) * page_size
        stmt = select(Consultation).where(
            Consultation.patient_id == patient_id,
            Consultation.doctor_id == doctor_id,
            Consultation.deleted_at.is_(None),
        ).order_by(Consultation.created_at.desc()).offset(offset).limit(page_size).options(
            selectinload(Consultation.soap_note),
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses),
            selectinload(Consultation.interactions)
        )

        result = await db.execute(stmt)
        consultations = result.scalars().all()

        if return_total:
            return consultations, total_count
        return consultations

    @staticmethod
    async def get_consultation_by_id(
        db: AsyncSession, doctor_id, consultation_id
    ) -> Consultation:
        ck = key_consultation(str(doctor_id), str(consultation_id))

        # ── Cache read ────────────────────────────────────────────────────────
        cached = await cache.get(ck)
        if cached is not None:
            logger.debug(f"Cache HIT: {ck}")
            return ConsultationResponse.model_validate(cached)

        # ── DB ────────────────────────────────────────────────────────────────
        stmt = select(Consultation).where(
            Consultation.id == consultation_id,
            Consultation.doctor_id == doctor_id,
        ).options(
            selectinload(Consultation.soap_note),
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses),
            selectinload(Consultation.interactions)
        )
        consultation = await db.scalar(stmt)
        if not consultation:
            raise ConsultationNotFoundException()

        # ── Write cache ───────────────────────────────────────────────────────
        await cache.set(
            ck,
            ConsultationResponse.model_validate(consultation).model_dump(mode="json"),
            TTL_CONSULTATION,
        )

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

    @staticmethod
    async def update_consultation_details(
        db:AsyncSession,doctor_id,consultation_id,update_data:ConsultationUpdate)->Consultation:
             #fetch consulatation with relations
            stmt=select(Consultation).where(
        Consultation.id==consultation_id,
        Consultation.doctor_id==doctor_id
    ).options(
        selectinload(Consultation.soap_note),
        selectinload(Consultation.medications),
        selectinload(Consultation.diagnoses),
        selectinload(Consultation.interactions)
    )
            consultation=await db.scalar(stmt)
            if not consultation:
                raise ConsultationNotFoundException()
            #update soap note
            if update_data.soap_note and consultation.soap_note:
                note_data=update_data.soap_note
                if note_data.subjective is not None:  consultation.soap_note.subjective=note_data.subjective
                if note_data.objective is not None: consultation.soap_note.objective = note_data.objective
                if note_data.assessment is not None: consultation.soap_note.assessment = note_data.assessment
                if note_data.plan is not None: consultation.soap_note.plan = note_data.plan
            if consultation.soap_note:
                consultation.soap_note.edited_by_doctor = True

            #update medication
            if update_data.medications is not None:
                kep_med_ids=[m.id for m in update_data.medications if m.id]

                for existing_med in consultation.medications:
                    if existing_med.id not in kep_med_ids:
                        await db.delete(existing_med)
                existing_meds_map={m.id:m for m in consultation.medications}
                for med_data in update_data.medications:
                    if med_data.id and med_data.id in existing_meds_map:
                        med=existing_meds_map[med_data.id]
                        med.name=med_data.name
                        med.dosage=med_data.dosage
                        med.frequency = med_data.frequency
                        med.duration = med_data.duration
                        med.route = med_data.route
                    else:
                        new_med = Medication(
                        consultation_id=consultation.id,
                        name=med_data.name,
                        dosage=med_data.dosage,
                        frequency=med_data.frequency,
                        duration=med_data.duration,
                        route=med_data.route
                    )
                        db.add(new_med)

            #update diagnoses        
            if update_data.diagnoses is not None:
                kept_diag_ids = [d.id for d in update_data.diagnoses if d.id]
            
                # Delete removed diagnoses
                for existing_diag in consultation.diagnoses:
                    if existing_diag.id not in kept_diag_ids:
                      await db.delete(existing_diag)
                    
                existing_diags_map = {d.id: d for d in consultation.diagnoses}
            
                # Update existing or add new diagnoses
                for diag_data in update_data.diagnoses:
                    if diag_data.id and diag_data.id in existing_diags_map:
                       diag = existing_diags_map[diag_data.id]
                       diag.icd_code = diag_data.icd_code
                       diag.description = diag_data.description
                    else:
                       new_diag = Diagnosis(
                        consultation_id=consultation.id,
                        icd_code=diag_data.icd_code,
                        description=diag_data.description
                    )
                       db.add(new_diag)

            await db.commit()
            
            # Re-fetch consultation so newly added medications/diagnoses are loaded in consultation.medications
            stmt = select(Consultation).where(Consultation.id == consultation_id, Consultation.doctor_id == doctor_id).options(
                selectinload(Consultation.soap_note),
                selectinload(Consultation.medications),
                selectinload(Consultation.diagnoses),
                selectinload(Consultation.interactions)
            )
            consultation = await db.scalar(stmt)

            # If medications or diagnoses were updated, delete old interactions and re-run RAG check
            if update_data.medications is not None or update_data.diagnoses is not None:
                for existing_interaction in list(consultation.interactions):
                    await db.delete(existing_interaction)
                await db.commit()
                
                await rag_service.check_drug_interactions(
                    consultation_id=str(consultation.id),
                    medications=consultation.medications,
                    diagnoses=consultation.diagnoses,
                    db=db
                )
                await db.commit()

            stmt = select(Consultation).where(Consultation.id == consultation_id, Consultation.doctor_id == doctor_id).options(
                selectinload(Consultation.soap_note),
                selectinload(Consultation.medications),
                selectinload(Consultation.diagnoses),
                selectinload(Consultation.interactions)
            )
            consultation = await db.scalar(stmt)

            # ── Invalidate single + list cache ────────────────────────────────
            await cache.delete(
                key_consultation(str(doctor_id), str(consultation_id)),
                key_consultations_list(str(doctor_id), str(consultation.patient_id)),
            )

            return consultation






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
    from app.services.notification_service import notification_service

    async with AsyncSessionLocal() as db:
        # 1. Fetch the consultation and mark PROCESSING
        stmt = select(Consultation).where(Consultation.id == consultation_id).options(selectinload(Consultation.patient))
        consultation = await db.scalar(stmt)
        if not consultation:
            logger.error(f"Consultation {consultation_id} not found in background task.")
            return

        # Idempotency guard: avoid parallel processing or redundant reprocessing
        if consultation.status in (ConsultationStatus.PROCESSING, ConsultationStatus.AWAITING_REVIEW, ConsultationStatus.COMPLETE):
            logger.warning(
                f"Consultation {consultation_id} is already in state {consultation.status}. Skipping duplicate execution."
            )
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
            # Run RAG drug interaction checks
            await rag_service.check_drug_interactions(
                 consultation_id=consultation_id,
                 medications=structured_data.medications,
                 diagnoses=structured_data.diagnoses,
                 db=db
                )
    

            # 8. Mark AWAITING_REVIEW — clinical documentation requires doctor sign-off
            consultation.status = ConsultationStatus.AWAITING_REVIEW
            await db.commit()
            
            # Send SMS reminders if there are medications and a patient phone number
            if structured_data.medications and consultation.patient and consultation.patient.phone:
                await notification_service.send_medication_reminders(
                    consultation.patient.phone,
                    structured_data.medications
                )

            logger.info(
                f"Consultation {consultation_id}: pipeline complete — status=AWAITING_REVIEW."
            )

            # ── Invalidate cache so next poll returns fresh COMPLETE data ──────
            # We don't have doctor_id here, so we build a partial key to
            # match `consultation:{doctor_id}:{consultation_id}`. Since we
            # can't wildcard without SCAN, we store an extra reverse-lookup
            # key on the consultation itself. Simpler: just use the known
            # doctor_id from the consultation object.
            try:
                doctor_id_str = str(consultation.doctor_id)
                patient_id_str = str(consultation.patient_id)
                from app.services.cache_service import key_stats
                await cache.delete(
                    key_consultation(doctor_id_str, consultation_id),
                    key_consultations_list(doctor_id_str, patient_id_str),
                    key_stats(doctor_id_str)
                )
                logger.debug(f"Cache invalidated for consultation {consultation_id} after COMPLETE.")
            except Exception as cache_exc:
                logger.warning(f"Cache invalidation failed after COMPLETE: {cache_exc}")

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

                    # ── Invalidate cache on failure too ───────────────────────
                    try:
                        doctor_id_str = str(consultation.doctor_id)
                        patient_id_str = str(consultation.patient_id)
                        await cache.delete(
                            key_consultation(doctor_id_str, consultation_id),
                            key_consultations_list(doctor_id_str, patient_id_str),
                        )
                    except Exception as cache_exc:
                        logger.warning(f"Cache invalidation failed after FAILED: {cache_exc}")

                except Exception as commit_exc:
                    logger.error(
                        f"Could not save FAILED status for {consultation_id}: {commit_exc}"
                    )
