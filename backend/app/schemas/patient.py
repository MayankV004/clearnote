from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

class PatientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[date] = None
    age: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[date] = None
    age: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    consent_given_at: Optional[datetime] = None
    consent_version: Optional[str] = None

class PatientResponse(PatientBase):
    id: UUID
    doctor_id: UUID
    created_at: datetime
    updated_at: datetime
    consent_given_at: Optional[datetime] = None
    consent_version: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
