from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.deps.auth import CurrentUser
from app.db.models.doctor import Doctor
from app.db.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["patients"])

async def get_current_doctor(state: CurrentUser, db: AsyncSession = Depends(get_db)) -> Doctor:
    """Helper to lookup internal Doctor UUID from Clerk user_id."""
    clerk_user_id = state.payload["sub"]
    stmt = select(Doctor).where(Doctor.clerk_user_id == clerk_user_id)
    doctor = await db.scalar(stmt)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found in database. Make sure you signed up correctly."
        )
    return doctor

@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """List all active patients for the authenticated doctor."""
    stmt = select(Patient).where(
        Patient.doctor_id == doctor.id,
        Patient.deleted_at.is_(None)
    ).order_by(Patient.created_at.desc())
    
    result = await db.execute(stmt)
    patients = result.scalars().all()
    return patients

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new patient record."""
    new_patient = Patient(
        doctor_id=doctor.id,
        name=patient_in.name,
        phone=patient_in.phone,
        email=patient_in.email,
        dob=patient_in.dob
    )
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    return new_patient
