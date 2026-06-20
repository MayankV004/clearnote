"""
tests/fixtures/factories.py
────────────────────────────
Simple async factory functions to create canonical test objects.
Import these in any test that needs a seeded DB row.
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import Consultation, ConsultationStatus


async def make_doctor(db: AsyncSession, **kwargs) -> Doctor:
    """Create and persist a Doctor row with sensible defaults."""
    defaults = dict(
        clerk_user_id=f"clerk_{uuid.uuid4().hex[:8]}",
        email=f"doctor_{uuid.uuid4().hex[:6]}@clearnote.test",
        name="Dr. Test",
    )
    defaults.update(kwargs)
    doctor = Doctor(**defaults)
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


async def make_patient(db: AsyncSession, doctor_id, **kwargs) -> Patient:
    """Create and persist a Patient row owned by `doctor_id`."""
    defaults = dict(
        doctor_id=doctor_id,
        name="Jane Patient",
        email=f"patient_{uuid.uuid4().hex[:6]}@clearnote.test",
        phone="9999999999",
    )
    defaults.update(kwargs)
    patient = Patient(**defaults)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def make_consultation(
    db: AsyncSession,
    doctor_id,
    patient_id,
    status: ConsultationStatus = ConsultationStatus.PENDING,
    **kwargs,
) -> Consultation:
    """Create and persist a Consultation row."""
    defaults = dict(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status=status,
    )
    defaults.update(kwargs)
    consultation = Consultation(**defaults)
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)
    return consultation
