import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from httpx import AsyncClient

from app.main import app
from app.models.consultation import Consultation, ConsultationStatus
from app.api.dependencies.auth import get_current_doctor
from tests.fixtures.factories import make_doctor, make_patient, make_consultation


def _override_auth(doctor):
    from starlette.requests import Request
    async def _get_doctor(request: Request = None):
        if request is not None:
            request.state.user_id = str(doctor.id)
        return doctor
    return _get_doctor


@pytest.mark.asyncio
async def test_get_consultation_audio_404_no_audio(client: AsyncClient, db_session):
    doctor = await make_doctor(db_session)
    patient = await make_patient(db_session, doctor.id)
    consultation = await make_consultation(
        db_session, doctor.id, patient.id, status=ConsultationStatus.COMPLETE, audio_s3_key=None
    )
    app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

    try:
        response = await client.get(f"/consultations/{consultation.id}/audio")
        assert response.status_code == 404
        assert "not found" in response.json()["message"].lower()
    finally:
        app.dependency_overrides.pop(get_current_doctor, None)


@pytest.mark.asyncio
async def test_get_consultation_audio_success(client: AsyncClient, db_session):
    doctor = await make_doctor(db_session)
    patient = await make_patient(db_session, doctor.id)
    consultation = await make_consultation(
        db_session, doctor.id, patient.id, status=ConsultationStatus.COMPLETE, audio_s3_key="audio/test-123.webm"
    )
    app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

    with patch(
        "app.api.routes.consultations.s3_service.generate_presigned_url",
        new_callable=AsyncMock,
    ) as mock_presign:
        mock_presign.return_value = "https://s3.amazonaws.com/test-bucket/audio/test-123.webm?token=abc"

        try:
            response = await client.get(f"/consultations/{consultation.id}/audio")
            assert response.status_code == 200
            assert response.json()["url"] == "https://s3.amazonaws.com/test-bucket/audio/test-123.webm?token=abc"
        finally:
            app.dependency_overrides.pop(get_current_doctor, None)
