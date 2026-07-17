from app.services.doctor_service import DoctorService
from app.schemas.doctor import DoctorResponse , DoctorOnboarding, DoctorUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.doctor import Doctor 
from fastapi import APIRouter , Depends , status, HTTPException
from app.core.exceptions import DoctorNotFoundException , DoctorAlreadyOnboardedException
from sqlalchemy.future import select
from app.api.dependencies.auth import get_current_doctor
from app.api.dependencies.db import get_db
from sqlalchemy import func
from datetime import datetime

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.patch("/onboarding" , response_model=DoctorResponse , status_code=status.HTTP_200_OK)
async def complete_onboarding(payload:DoctorOnboarding , db:AsyncSession= Depends(get_db), doctor:Doctor = Depends(get_current_doctor)):
    try:

        update_doctor = await DoctorService.update_doctor_onboarding(db , doctor.id , payload)

        return update_doctor
    except DoctorNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="Doctor not found")
    except DoctorAlreadyOnboardedException:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Doctor already onboarded")

@router.get("/me", response_model=DoctorResponse)
async def get_my_profile(
    doctor: Doctor = Depends(get_current_doctor)
):
    """
    Fetch the currently logged-in doctor's profile.
    """
    return doctor

@router.patch("/me", response_model=DoctorResponse)
async def update_my_profile(
    payload: DoctorUpdate,
    db: AsyncSession = Depends(get_db),
    doctor: Doctor = Depends(get_current_doctor)
):
    """
    Update the currently logged-in doctor's profile.
    """
    try:
        updated_doctor = await DoctorService.update_doctor_profile(
            db, str(doctor.id), payload.model_dump(exclude_unset=True)
        )
        return updated_doctor
    except DoctorNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

@router.get("/me/stats", response_model=dict)
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    doctor: Doctor = Depends(get_current_doctor)
):
    from app.models.patient import Patient
    from app.models.consultation import Consultation, ConsultationStatus
    
    # 1. Total patients
    stmt_total_patients = select(func.count(Patient.id)).where(Patient.doctor_id == doctor.id, Patient.deleted_at.is_(None))
    total_patients = await db.scalar(stmt_total_patients) or 0
    
    # 2. Patients added this month
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    stmt_new_patients = select(func.count(Patient.id)).where(
        Patient.doctor_id == doctor.id,
        Patient.deleted_at.is_(None),
        Patient.created_at >= start_of_month
    )
    new_patients_this_month = await db.scalar(stmt_new_patients) or 0
    
    # 3. Total consultations
    stmt_total_consultations = select(func.count(Consultation.id)).where(
        Consultation.doctor_id == doctor.id,
        Consultation.deleted_at.is_(None)
    )
    total_consultations = await db.scalar(stmt_total_consultations) or 0
    
    # 4. Total SOAP notes (Completed consultations)
    stmt_soap_notes = select(func.count(Consultation.id)).where(
        Consultation.doctor_id == doctor.id,
        Consultation.deleted_at.is_(None),
        Consultation.status == ConsultationStatus.COMPLETE
    )
    total_soap_notes = await db.scalar(stmt_soap_notes) or 0
    
    return {
        "total_patients": total_patients,
        "new_patients_this_month": new_patients_this_month,
        "total_consultations": total_consultations,
        "total_soap_notes": total_soap_notes
    }