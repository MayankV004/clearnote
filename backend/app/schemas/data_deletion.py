from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.data_deletion import DataDeletionStatus

class DataDeletionRequestCreate(BaseModel):
    patient_id: UUID

class DataDeletionRequestResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    status: DataDeletionStatus
    requested_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
