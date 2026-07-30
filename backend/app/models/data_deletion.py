import uuid
import enum
from sqlalchemy import Column, String, DateTime, func, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class DataDeletionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    REJECTED = "REJECTED"

class DataDeletionRequest(Base):
    __tablename__ = "data_deletion_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    status = Column(Enum(DataDeletionStatus), default=DataDeletionStatus.PENDING, nullable=False)
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Doctor")
