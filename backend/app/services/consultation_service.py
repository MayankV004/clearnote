import os
import time
import tempfile
from typing import List

import boto3
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import ConsultationNotFoundException, PatientNotOwnedException
from app.models.consultation import Consultation, ConsultationStatus
from app.models.patient import Patient
from app.models.soap_note import SOAPNote

def get_s3_client():
    kwargs = dict(
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    if settings.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
    return boto3.client("s3", **kwargs)

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
    def upload_audio_to_s3(audio_bytes: bytes, consultation_id: str) -> str:
        """
        Uploads raw audio bytes to S3.
        Returns the S3 key on success.
        """
        s3 = get_s3_client()
        key = f"audio/{consultation_id}.webm"
        
        try:
            s3.put_object(
                Bucket=settings.AUDIO_BUCKET_NAME,
                Key=key,
                Body=audio_bytes,
                ContentType="audio/webm",
            )
            logger.info(f"Successfully uploaded audio to S3: {key}")
            return key
        except Exception as e:
            logger.error(f"Failed to upload audio to S3 for {consultation_id}: {e}")
            raise e

    @staticmethod
    async def save_audio_and_transcribe(
        db: AsyncSession,
        consultation: Consultation,
        audio_bytes: bytes,
        background_tasks: BackgroundTasks,
    ) -> None:
        """
        Orchestrates the audio pipeline:
        1. Uploads audio to S3.
        2. Saves the S3 key to the consultation record.
        3. Enqueues a background task for Deepgram transcription.
        """
        # Upload the audio file first
        s3_key = ConsultationService.upload_audio_to_s3(audio_bytes, str(consultation.id))

        # Update the database record with the new S3 key
        consultation.audio_s3_key = s3_key
        await db.commit()

        # Enqueue the heavy transcription task
        background_tasks.add_task(
            _run_transcription,
            consultation_id=str(consultation.id),
            s3_key=s3_key,
        )


# ── Background Task (Runs outside the HTTP Request Lifecycle) ─────────────

async def _run_transcription(consultation_id: str, s3_key: str) -> None:
    """
    Downloads audio from S3 and transcribes it using Deepgram's Nova-2 Medical model.
    Creates a SOAPNote with the raw transcript.
    """
    # Local import to avoid circular dependencies
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        # 1. Fetch the consultation
        stmt = select(Consultation).where(Consultation.id == consultation_id)
        consultation = await db.scalar(stmt)
        if not consultation:
            logger.error(f"Consultation {consultation_id} not found in background task.")
            return

        # 2. Update status to PROCESSING
        consultation.status = ConsultationStatus.PROCESSING
        await db.commit()

        tmp_path = None

        try:
            from starlette.concurrency import run_in_threadpool
            
            s3 = get_s3_client()
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp_path = tmp.name
            
            # Run the synchronous boto3 download in a threadpool to avoid blocking the event loop
            await run_in_threadpool(s3.download_file, settings.AUDIO_BUCKET_NAME, s3_key, tmp_path)
            logger.info(f"Downloaded S3 audio for {consultation_id} to {tmp_path}")

            from deepgram import AsyncDeepgramClient
            deepgram = AsyncDeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
            
            with open(tmp_path, "rb") as audio:
                audio_data = audio.read()

            logger.info(f"Sending audio to Deepgram for consultation {consultation_id}...")
            # Use async client to avoid blocking the event loop
            response = await deepgram.listen.v1.media.transcribe_file(
                request=audio_data, 
                model="nova-2-medical",
                smart_format=True,
                diarize=True,
                punctuate=True
            )
            
            # Extract transcript string from Deepgram's JSON response
            transcript = response.results.channels[0].alternatives[0].transcript
            
            if not transcript:
                raise ValueError("Deepgram returned an empty transcript.")

            # 5. Extract structured data using Groq LLM
            from app.services.llm_service import llm_service
            from app.models.medication import Medication
            from app.models.diagnosis import Diagnosis

            structured_data = await llm_service.extract_structured_data(transcript)

            # 6. Save the transcript and parsed fields into a new SOAPNote
            soap_note = SOAPNote(
                consultation_id=consultation_id,
                raw_transcript=transcript,
                subjective=structured_data.subjective,
                objective=structured_data.objective,
                assessment=structured_data.assessment,
                plan=structured_data.plan,
            )
            db.add(soap_note)

            # 7. Add medications
            for med in structured_data.medications:
                db.add(Medication(
                    consultation_id=consultation_id,
                    name=med.name,
                    dosage=med.dosage,
                    frequency=med.frequency,
                    duration=med.duration,
                    route=med.route
                ))

            # 8. Add diagnoses
            for diag in structured_data.diagnoses:
                db.add(Diagnosis(
                    consultation_id=consultation_id,
                    icd_code=diag.icd_code,
                    description=diag.description
                ))
            
            # 9. Mark consultation as COMPLETE
            consultation.status = ConsultationStatus.COMPLETE
            await db.commit()

            logger.info(f"Successfully transcribed and extracted SOAP data for {consultation_id}")

        except Exception as e:
            # Handle any failure (S3 error, Deepgram error, DB error)
            logger.error(f"Transcription failed for {consultation_id}: {e}")
            consultation.status = ConsultationStatus.FAILED
            consultation.processing_error = str(e)
            await db.commit()

        finally:
            # Always clean up temporary files to prevent disk leaks
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
