from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.patient import Patient
from app.schemas.patient import PatientCreate
from app.core.logger import logger
from app.core.exceptions import PatientNotFoundException

class PatientService:
    @staticmethod
    async def get_patients_for_doctor(db: AsyncSession, doctor_id) -> List[Patient]:
        stmt = select(Patient).where(
            Patient.doctor_id == doctor_id,
            Patient.deleted_at.is_(None)
        ).order_by(Patient.created_at.desc())
        
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_patient_by_id(db: AsyncSession, doctor_id, patient_id: str) -> Patient:
        """Fetch a single patient, ensuring it belongs to the requesting doctor."""
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == doctor_id,
            Patient.deleted_at.is_(None)
        )
        patient = await db.scalar(stmt)
        if not patient:
            logger.warning(f"Patient {patient_id} not found for doctor {doctor_id}")
            raise PatientNotFoundException()
        return patient

    @staticmethod
    async def create_patient(db: AsyncSession, doctor_id, patient_in: PatientCreate) -> Patient:
        new_patient = Patient(
            doctor_id=doctor_id,
            name=patient_in.name,
            phone=patient_in.phone,
            email=patient_in.email,
            dob=patient_in.dob
        )
        db.add(new_patient)
        await db.commit()
        await db.refresh(new_patient)
        
        logger.info(f"Created new patient: {new_patient.name} for Doctor ID: {doctor_id}")
        
        return new_patient
