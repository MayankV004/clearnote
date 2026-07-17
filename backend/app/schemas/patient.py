from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict, Field

class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, description="Patient's full name")
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9\-\(\)\s]{7,20}$", description="Valid phone number")
    email: Optional[EmailStr] = None
    dob: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=150, description="Age must be between 0 and 150")
    height: Optional[str] = Field(None, max_length=20)
    weight: Optional[str] = Field(None, max_length=20)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9\-\(\)\s]{7,20}$")
    email: Optional[EmailStr] = None
    dob: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    height: Optional[str] = Field(None, max_length=20)
    weight: Optional[str] = Field(None, max_length=20)
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
