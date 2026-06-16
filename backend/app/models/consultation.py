import uuid
import enum
from sqlalchemy import Column, String, DateTime, func, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class ConsultationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    
    audio_s3_key = Column(String, nullable=True)
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.PENDING, nullable=False)
    transcription_job_id = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    processing_error = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    patient = relationship("Patient")
    doctor = relationship("Doctor")
    soap_note = relationship("SOAPNote", back_populates="consultation", uselist=False, lazy="selectin")
    medications = relationship("Medication", back_populates="consultation")
    diagnoses = relationship("Diagnosis", back_populates="consultation")
    interactions = relationship("Interaction", back_populates="consultation")
