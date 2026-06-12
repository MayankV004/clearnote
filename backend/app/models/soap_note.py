import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

class SOAPNote(Base):
    __tablename__ = "soap_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id"), nullable=False, unique=True)
    
    subjective = Column(String, nullable=True)
    objective = Column(String, nullable=True)
    assessment = Column(String, nullable=True)
    plan = Column(String, nullable=True)
    
    raw_transcript = Column(String, nullable=True)
    edited_by_doctor = Column(Boolean, default=False)
    edit_history = Column(JSONB, nullable=True)

    consultation = relationship("Consultation", back_populates="soap_note")
