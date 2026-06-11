from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies.db import get_db
from app.api.dependencies.auth import CurrentUser
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse
from app.api.dependencies.auth import get_current_doctor
from app.core.exceptions import PatientNotFoundException

router = APIRouter(prefix="/patients", tags=["patients"])

from app.services.patient_service import PatientService

@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """List all active patients for the authenticated doctor."""
    return await PatientService.get_patients_for_doctor(db, doctor.id)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Get a single patient by ID (must belong to the authenticated doctor)."""
    try:
        return await PatientService.get_patient_by_id(db, doctor.id, patient_id)
    except PatientNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new patient record."""
    return await PatientService.create_patient(db, doctor.id, patient_in)
