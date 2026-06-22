from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.consultation import ConsultationStatus


class MedicationResponse(BaseModel):
    id: UUID
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    route: Optional[str] = None
    rag_checked: bool = False
    rag_verdict: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class DiagnosisResponse(BaseModel):
    id: UUID
    icd_code: Optional[str] = None
    description: str
    model_config = ConfigDict(from_attributes=True)


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
    medications: List[MedicationResponse] = []
    diagnoses: List[DiagnosisResponse] = []
    model_config = ConfigDict(from_attributes=True)

class MedicationUpdate(BaseModel):
    id:Optional[UUID]=None
    name:str
    dosage:Optional[str]=None
    frequency:Optional[str]=None
    duration:Optional[str]=None
    route:Optional[str]=None

class DiagnosisUpdate(BaseModel):
    id:Optional[UUID]=None
    icd_code:Optional[str]=None
    description:str

class SOAPNoteUpdate(BaseModel):
    subjective:Optional[str]=None
    objective:Optional[str]=None
    assessment:Optional[str]=None
    plan:Optional[str]=None

class ConsultationUpdate(BaseModel):
    soap_note:Optional[SOAPNoteUpdate]=None
    medications:Optional[List[MedicationUpdate]]=None
    diagnoses:Optional[List[DiagnosisUpdate]]=None    