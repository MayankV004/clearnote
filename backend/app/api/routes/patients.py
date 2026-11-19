from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies.db import get_db
from app.api.dependencies.auth import CurrentUser
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.api.dependencies.auth import get_current_doctor
from app.core.exceptions import PatientNotFoundException

router = APIRouter(prefix="/patients", tags=["patients"])

from app.services.patient_service import PatientService

@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    response: Response,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """List active patients for the authenticated doctor with pagination."""
    patients, total_count = await PatientService.get_patients_for_doctor(
        db, doctor.id, page=page, page_size=page_size, return_total=True
    )
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Page"] = str(page)
    response.headers["X-Page-Size"] = str(page_size)
    return patients

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

@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    patient_in: PatientUpdate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Update a patient's details."""
    try:
        return await PatientService.update_patient(db, doctor.id, str(patient_id), patient_in)
    except PatientNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
