from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.core.logger import logger
from app.core.exceptions import PatientNotFoundException
from app.services.cache_service import (
    cache,
    key_patients_list,
    key_patient,
    TTL_PATIENTS_LIST,
    TTL_PATIENT,
)


class PatientService:

    @staticmethod
    async def get_patients_for_doctor(db: AsyncSession, doctor_id) -> List[Patient]:
        ck = key_patients_list(str(doctor_id))

        # ── Cache read ────────────────────────────────────────────────────────
        cached = await cache.get(ck)
        if cached is not None:
            logger.debug(f"Cache HIT: {ck}")
            return [PatientResponse.model_validate(p) for p in cached]

        # ── DB ────────────────────────────────────────────────────────────────
        stmt = select(Patient).where(
            Patient.doctor_id == doctor_id,
            Patient.deleted_at.is_(None)
        ).order_by(Patient.created_at.desc())

        result = await db.execute(stmt)
        patients = result.scalars().all()

        # ── Write cache ───────────────────────────────────────────────────────
        serialised = [PatientResponse.model_validate(p).model_dump(mode="json") for p in patients]
        await cache.set(ck, serialised, TTL_PATIENTS_LIST)

        return patients

    @staticmethod
    async def get_patient_by_id(db: AsyncSession, doctor_id, patient_id: str) -> Patient:
        """Fetch a single patient, ensuring it belongs to the requesting doctor."""
        ck = key_patient(str(doctor_id), str(patient_id))

        # ── Cache read ────────────────────────────────────────────────────────
        cached = await cache.get(ck)
        if cached is not None:
            logger.debug(f"Cache HIT: {ck}")
            return PatientResponse.model_validate(cached)

        # ── DB ────────────────────────────────────────────────────────────────
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == doctor_id,
            Patient.deleted_at.is_(None)
        )
        patient = await db.scalar(stmt)
        if not patient:
            logger.warning(f"Patient {patient_id} not found for doctor {doctor_id}")
            raise PatientNotFoundException()

        # ── Write cache ───────────────────────────────────────────────────────
        await cache.set(ck, PatientResponse.model_validate(patient).model_dump(mode="json"), TTL_PATIENT)

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

        logger.info(f"Created new patient ID: {new_patient.id} for Doctor ID: {doctor_id}")

        from app.services.cache_service import key_stats
        # ── Invalidate patient list cache ─────────────────────────────────────
        await cache.delete(
            key_patients_list(str(doctor_id)),
            key_stats(str(doctor_id))
        )

        return new_patient

    @staticmethod
    async def update_patient(db: AsyncSession, doctor_id, patient_id: str, patient_in: PatientUpdate) -> Patient:
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == doctor_id,
            Patient.deleted_at.is_(None)
        )
        patient = await db.scalar(stmt)
        if not patient:
            logger.warning(f"Patient {patient_id} not found for doctor {doctor_id} during update")
            raise PatientNotFoundException()

        update_data = patient_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)

        await db.commit()
        await db.refresh(patient)

        logger.info(f"Updated patient ID: {patient_id} for Doctor ID: {doctor_id}")

        # ── Invalidate caches ─────────────────────────────────────
        await cache.delete(key_patient(str(doctor_id), str(patient_id)))
        await cache.delete(key_patients_list(str(doctor_id)))

        return patient
