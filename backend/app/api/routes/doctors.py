from app.services.doctor_service import DoctorService
from app.schemas.doctor import DoctorResponse , DoctorOnboarding, DoctorUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.doctor import Doctor 
from fastapi import APIRouter , Depends , status, HTTPException
from app.core.exceptions import DoctorNotFoundException , DoctorAlreadyOnboardedException
from sqlalchemy.future import select
from app.api.dependencies.auth import get_current_doctor
from app.api.dependencies.db import get_db

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