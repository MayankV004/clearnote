from app.schemas.doctor import DoctorOnboarding
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.future import select
from app.models.doctor import Doctor
from app.core.exceptions import DoctorNotFoundException , DoctorAlreadyOnboardedException
from app.core.logger import logger

class DoctorService:
    @staticmethod
    async def create_doctor_from_clerk(db: AsyncSession, clerk_id: str, email: str, name: str):
        stmt = insert(Doctor).values(
            clerk_user_id=clerk_id,
            email=email,
            name=name
        ).on_conflict_do_nothing(index_elements=["clerk_user_id"])
        
        await db.execute(stmt)
        await db.commit()

    @staticmethod
    async def update_doctor_onboarding(db: AsyncSession , doctor_id:str , data: DoctorOnboarding):

        # fetching the doctor details from DB
        stmt = select(Doctor).where(Doctor.id == doctor_id)

        # scalart is used to fetch single value
        doctor = await db.scalar(stmt)

        # checking if the doctor exists or not
        if not doctor:
            logger.error(f"Failed to onboard: Doctor with id {doctor_id} not found!")
            raise DoctorNotFoundException()

        if doctor.is_onboarded:
            logger.warning(f"Doctor {doctor_id} attempted to onboard again.")
            raise DoctorAlreadyOnboardedException()
            
        # model_dump is used to convert the Pydantic model to a dictionary
        # exclude_unset=True is used to exclude the fields that are not set
        update_data = data.model_dump(exclude_unset=True)

        # updating the doctor details dynamically
        for key , value in update_data.items():
            setattr(doctor , key , value)
        
        doctor.is_onboarded = True

        await db.commit()
        await db.refresh(doctor)
        
        logger.info(f"Successfully onboarded doctor: {doctor.email} | Clinic: {data.clinic_name}")
        
        return doctor


        