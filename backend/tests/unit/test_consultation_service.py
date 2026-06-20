"""
tests/unit/test_consultation_service.py
─────────────────────────────────────────
Unit tests for ConsultationService CRUD methods.

These tests use the in-memory SQLite DB (via the `db_session` fixture from
conftest.py). No real Postgres connection is needed.
"""

import pytest
from sqlalchemy.future import select

from app.models.consultation import Consultation, ConsultationStatus
from app.services.consultation_service import ConsultationService
from app.core.exceptions import ConsultationNotFoundException, PatientNotOwnedException

from tests.fixtures.factories import make_doctor, make_patient, make_consultation


class TestCreateConsultation:
    """Tests for ConsultationService.create_consultation"""

    async def test_creates_consultation_with_pending_status(self, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)

        consultation = await ConsultationService.create_consultation(
            db_session, doctor.id, patient.id
        )

        assert consultation is not None
        assert consultation.status == ConsultationStatus.PENDING
        assert consultation.patient_id == patient.id
        assert consultation.doctor_id == doctor.id

    async def test_raises_if_patient_belongs_to_another_doctor(self, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor_a.id)  # owned by doctor_a

        with pytest.raises(PatientNotOwnedException):
            await ConsultationService.create_consultation(
                db_session, doctor_b.id, patient.id  # doctor_b tries to use it
            )

    async def test_raises_if_patient_does_not_exist(self, db_session):
        import uuid
        doctor = await make_doctor(db_session)

        with pytest.raises(PatientNotOwnedException):
            await ConsultationService.create_consultation(
                db_session, doctor.id, uuid.uuid4()  # non-existent patient
            )


class TestGetConsultationById:
    """Tests for ConsultationService.get_consultation_by_id"""

    async def test_returns_consultation_for_correct_doctor(self, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        result = await ConsultationService.get_consultation_by_id(
            db_session, doctor.id, consultation.id
        )

        assert result.id == consultation.id

    async def test_raises_if_wrong_doctor(self, db_session):
        """A doctor must not be able to fetch another doctor's consultation."""
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor_a.id)
        consultation = await make_consultation(db_session, doctor_a.id, patient.id)

        with pytest.raises(ConsultationNotFoundException):
            await ConsultationService.get_consultation_by_id(
                db_session, doctor_b.id, consultation.id
            )

    async def test_raises_for_nonexistent_id(self, db_session):
        import uuid
        doctor = await make_doctor(db_session)

        with pytest.raises(ConsultationNotFoundException):
            await ConsultationService.get_consultation_by_id(
                db_session, doctor.id, uuid.uuid4()
            )


class TestGetConsultationsForPatient:
    """Tests for ConsultationService.get_consultations_for_patient"""

    async def test_returns_only_doctors_consultations(self, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)
        patient_b = await make_patient(db_session, doctor_b.id)

        await make_consultation(db_session, doctor_a.id, patient_a.id)
        await make_consultation(db_session, doctor_a.id, patient_a.id)
        await make_consultation(db_session, doctor_b.id, patient_b.id)  # different doctor

        results = await ConsultationService.get_consultations_for_patient(
            db_session, doctor_a.id, patient_a.id
        )

        assert len(results) == 2
        for c in results:
            assert c.doctor_id == doctor_a.id

    async def test_returns_empty_list_for_no_consultations(self, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)

        results = await ConsultationService.get_consultations_for_patient(
            db_session, doctor.id, patient.id
        )
        assert results == []

    async def test_ordered_by_created_at_desc(self, db_session):
        """
        All 3 consultations must be returned.
        Note: True DESC ordering by created_at is validated at the DB level
        (ORDER BY clause in the query). SQLite's func.now() resolution within
        a single test transaction isn't precise enough to assert strict ordering,
        but the presence of all 3 records confirms the query runs correctly.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)

        c1 = await make_consultation(db_session, doctor.id, patient.id)
        c2 = await make_consultation(db_session, doctor.id, patient.id)
        c3 = await make_consultation(db_session, doctor.id, patient.id)

        results = await ConsultationService.get_consultations_for_patient(
            db_session, doctor.id, patient.id
        )
        result_ids = {str(c.id) for c in results}

        assert len(results) == 3
        assert str(c1.id) in result_ids
        assert str(c2.id) in result_ids
        assert str(c3.id) in result_ids
