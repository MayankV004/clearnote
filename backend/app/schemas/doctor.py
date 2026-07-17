# Validation Schema of Doctor Model

from pydantic import BaseModel , ConfigDict
from typing import Optional 
from uuid import UUID
from datetime import date, datetime 

class DoctorOnboarding(BaseModel):
    years_of_experience: int
    bio: str
    clinic_name: str 
    clinic_address: str
    clinic_phone: str 
    speciality: str 
    license_no: str 
  
class DoctorUpdate(BaseModel):
    license_no: Optional[str] = None
    signature_url: Optional[str] = None


class DoctorResponse(BaseModel):
    id: UUID
    name: str
    email: str
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_phone: Optional[str] = None
    speciality: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    license_no: Optional[str] = None
    signature_url: Optional[str] = None
    is_onboarded: bool
    
    model_config = ConfigDict(from_attributes=True)
