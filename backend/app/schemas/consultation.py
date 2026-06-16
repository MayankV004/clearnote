from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.consultation import ConsultationStatus


class SOAPNoteResponse(BaseModel):
    id : UUID
    raw_transcript: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    edited_by_doctor: bool = False
    model_config = ConfigDict(from_attributes=True)

class ConsultationCreate(BaseModel):
    patient_id: UUID     # the only thing the frontend needs to send

class ConsultationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    status: ConsultationStatus          # PENDING / PROCESSING / COMPLETE / FAILED
    audio_s3_key: Optional[str] = None
    duration_seconds: Optional[int] = None
    processing_error: Optional[str] = None
    created_at: datetime
    soap_note: Optional[SOAPNoteResponse] = None   # None until transcription completes
    model_config = ConfigDict(from_attributes=True)