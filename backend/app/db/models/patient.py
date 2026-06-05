import uuid
from sqlalchemy import Column, String, Date, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    consent_given_at = Column(DateTime(timezone=True), nullable=True)
    consent_version = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Example of a relationship back to the Doctor model
    # doctor = relationship("Doctor", back_populates="patients")
