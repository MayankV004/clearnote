import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.api.dependencies.db import get_db
from app.api.dependencies.auth import get_current_doctor
from app.core.limiter import limiter
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.data_deletion import DataDeletionRequest, DataDeletionStatus
from app.schemas.data_deletion import DataDeletionRequestCreate, DataDeletionRequestResponse
from app.services.s3_service import s3_service

router = APIRouter(prefix="/data-deletion", tags=["Data Deletion"])

@router.post("/", response_model=DataDeletionRequestResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def request_data_deletion(
    request: Request,
    req: DataDeletionRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    # Verify patient exists and belongs to the authenticated doctor
    stmt = select(Patient).where(
        Patient.id == req.patient_id,
        Patient.doctor_id == current_doctor.id
    )
    patient = await db.scalar(stmt)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    deletion_req = DataDeletionRequest(
        patient_id=patient.id,
        doctor_id=current_doctor.id,
        status=DataDeletionStatus.PENDING
    )
    db.add(deletion_req)
    await db.commit()
    await db.refresh(deletion_req)
    return deletion_req


@router.post("/{request_id}/process", response_model=DataDeletionRequestResponse)
async def process_data_deletion(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    stmt = select(DataDeletionRequest).where(
        DataDeletionRequest.id == request_id,
        DataDeletionRequest.doctor_id == current_doctor.id,
        DataDeletionRequest.status == DataDeletionStatus.PENDING
    )
    deletion_req = await db.scalar(stmt)
    
    if not deletion_req:
        raise HTTPException(status_code=404, detail="Pending deletion request not found")

    # Hard delete the patient for this doctor
    patient_stmt = select(Patient).where(
        Patient.id == deletion_req.patient_id,
        Patient.doctor_id == current_doctor.id
    )
    patient = await db.scalar(patient_stmt)
    
    if patient:
        # Cascade S3 deletion: remove all audio and prescription PDF assets
        consultations_stmt = select(Consultation).where(
            Consultation.patient_id == patient.id
        )
        consultations_res = await db.execute(consultations_stmt)
        consultations = consultations_res.scalars().all()
        for c in consultations:
            if c.audio_s3_key:
                await s3_service.delete_audio(c.audio_s3_key)
            if c.prescription_s3_key:
                await s3_service.delete_pdf(c.prescription_s3_key)

        await db.delete(patient)
    
    deletion_req.status = DataDeletionStatus.PROCESSED
    deletion_req.processed_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(deletion_req)
    return deletion_req

@router.get("/", response_model=List[DataDeletionRequestResponse])
async def list_data_deletion_requests(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    stmt = (
        select(DataDeletionRequest)
        .where(DataDeletionRequest.doctor_id == current_doctor.id)
        .order_by(DataDeletionRequest.requested_at.desc())
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()
    return requests
