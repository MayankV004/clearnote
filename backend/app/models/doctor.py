from sqlalchemy import null
import uuid
from sqlalchemy import Column, String, Boolean,Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Doctor(Base):
    __tablename__ = "doctors"

    # Basic Fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4 , index=True)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False , index=True , unique=True)
    signature_url = Column(String, nullable=True)
    license_no = Column(String, nullable=True) 
    is_mfa_enabled = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Progessive Form Fields
    speciality = Column(String , nullable=True)
    clinic_name = Column(String, nullable=True)
    clinic_phone = Column(String, nullable=True)
    clinic_address = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    bio = Column(String , nullable=True)
    is_onboarded = Column(Boolean , default=False)

    # Audit Columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
