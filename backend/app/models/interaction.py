import uuid
from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id"), nullable=False)
    
    drug_a = Column(String, nullable=False)
    drug_b = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    guideline_ref = Column(String, nullable=True)
    mechanism = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    consultation = relationship("Consultation", back_populates="interactions")
