from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

class PatientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[date] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: UUID
    doctor_id: UUID
    created_at: datetime
    updated_at: datetime
    consent_given_at: Optional[datetime] = None
    consent_version: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
