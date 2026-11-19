"""
tests/unit/test_clinical_review.py
──────────────────────────────────
Unit tests for TICKET-06 (AI-01):
  - Consultation transitions to AWAITING_REVIEW after background extraction
  - Prescriptions are blocked while consultation is in AWAITING_REVIEW
  - POST /consultations/{id}/approve promotes status to COMPLETE
  - Cross-tenant approval rejection
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select

from app.models.consultation import Consultation, ConsultationStatus
from app.services.consultation_service import _run_transcription
from app.api.dependencies.auth import get_current_doctor
from app.main import app
from tests.fixtures.factories import make_doctor, make_patient, make_consultation


def _override_auth(doctor):
    from starlette.requests import Request
    async def _get_doctor(request: Request = None):
        if request is not None:
            request.state.user_id = str(doctor.id)
        return doctor
    return _get_doctor


@pytest.fixture
def mock_pipeline_dependencies(mocker, db_session):
    from unittest.mock import AsyncMock, MagicMock

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=False)

    mocker.patch(
        "app.db.session.AsyncSessionLocal",
        return_value=mock_ctx,
    )
    mocker.patch(
        "app.services.s3_service.s3_service.download_audio",
        new_callable=AsyncMock,
        return_value=b"fake-pcm-audio-bytes",
    )
    from app.services.deepgram_service import TranscriptionResult
    from app.schemas.llm import SOAPExtractionResult, MedicationSchema, DiagnosisSchema

    mocker.patch(
        "app.services.deepgram_service.deepgram_service.transcribe_audio",
        new_callable=AsyncMock,
        return_value=TranscriptionResult(
            transcript="Doctor: Hello. Patient: My throat hurts.",
            confidence=0.98,
            duration_seconds=42.0,
        ),
    )
    mocker.patch(
        "app.services.llm_service.llm_service.extract_structured_data",
        new_callable=AsyncMock,
        return_value=SOAPExtractionResult(
            subjective="Sore throat",
            objective="Red pharynx",
            assessment="Pharyngitis",
            plan="Amoxicillin",
            medications=[
                MedicationSchema(
                    name="Amoxicillin",
                    dosage="500mg",
                    frequency="TID",
                    duration="7 days",
                    route="oral",
                )
            ],
            diagnoses=[DiagnosisSchema(icd_code="J02.9", description="Acute pharyngitis")],
            allergies=[],
            confidence=0.95,
        ),
    )
    mocker.patch(
        "app.services.rag_service.rag_service.check_drug_interactions",
        new_callable=AsyncMock,
        return_value=None,
    )


class TestClinicalReviewFlow:

    async def test_extraction_sets_status_to_awaiting_review(
        self, db_session, mock_pipeline_dependencies
    ):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.AWAITING_REVIEW

    async def test_prescription_blocked_when_awaiting_review(
        self, client: AsyncClient, db_session
    ):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(
            db_session, doctor.id, patient.id, status=ConsultationStatus.AWAITING_REVIEW
        )
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        try:
            response = await client.post(f"/consultations/{consultation.id}/prescription")
            assert response.status_code == 400
            assert "approved" in response.json()["detail"].lower()
        finally:
            app.dependency_overrides.pop(get_current_doctor, None)

    async def test_approve_consultation_sets_complete(
        self, client: AsyncClient, db_session
    ):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(
            db_session, doctor.id, patient.id, status=ConsultationStatus.AWAITING_REVIEW
        )
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        try:
            response = await client.post(f"/consultations/{consultation.id}/approve")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == ConsultationStatus.COMPLETE.value

            refreshed = await db_session.scalar(
                select(Consultation).where(Consultation.id == consultation.id)
            )
            assert refreshed.status == ConsultationStatus.COMPLETE
        finally:
            app.dependency_overrides.pop(get_current_doctor, None)

    async def test_approve_rejects_unowned_consultation(
        self, client: AsyncClient, db_session
    ):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session, clerk_user_id="user_doctor_b")
        patient_b = await make_patient(db_session, doctor_b.id)
        consultation_b = await make_consultation(
            db_session, doctor_b.id, patient_b.id, status=ConsultationStatus.AWAITING_REVIEW
        )
        # Authenticated as doctor_a in dependency override
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_a)

        try:
            response = await client.post(f"/consultations/{consultation_b.id}/approve")
            assert response.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_doctor, None)
