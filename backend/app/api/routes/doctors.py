from app.services.doctor_service import DoctorService
from app.schemas.doctor import DoctorResponse , DoctorOnboarding, DoctorUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.doctor import Doctor 
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
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
    if doctor.signature_url and not doctor.signature_url.startswith("http"):
        from app.services.s3_service import s3_service
        from app.core.config import settings
        try:
            presigned = await s3_service.generate_presigned_url(doctor.signature_url, bucket_name=settings.PDF_BUCKET_NAME)
            resp = DoctorResponse.model_validate(doctor)
            resp.signature_url = presigned
            return resp
        except Exception:
            pass
    return doctor

@router.post("/me/signature", response_model=dict)
async def upload_signature(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    doctor: Doctor = Depends(get_current_doctor)
):
    """
    Upload a digital signature image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    from app.services.s3_service import s3_service
    s3_key = await s3_service.upload_signature(file_bytes, str(doctor.id), file.content_type)
    
    from app.services.doctor_service import DoctorService
    await DoctorService.update_doctor_profile(db, str(doctor.id), {"signature_url": s3_key})
    
    from app.core.config import settings
    presigned = await s3_service.generate_presigned_url(s3_key, bucket_name=settings.PDF_BUCKET_NAME)
    return {"signature_url": presigned}

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
    from app.services.cache_service import cache, key_stats, TTL_STATS
    
    cache_key = key_stats(str(doctor.id))
    cached_stats = await cache.get(cache_key)
    if cached_stats:
        return cached_stats
    
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
    
    stats = {
        "total_patients": total_patients,
        "new_patients_this_month": new_patients_this_month,
        "total_consultations": total_consultations,
        "total_soap_notes": total_soap_notes
    }
    
    await cache.set(cache_key, stats, TTL_STATS)
    return stats