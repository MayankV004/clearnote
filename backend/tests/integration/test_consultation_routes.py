"""
tests/integration/test_consultation_routes.py
──────────────────────────────────────────────
Integration tests for the /consultations HTTP routes.

These use the httpx AsyncClient wired to the FastAPI app (via the `client`
fixture in conftest.py). The DB is the in-memory SQLite test session.
Clerk JWT auth is mocked by overriding the `get_current_doctor` dependency.

Tests cover: create, list, and get-by-id routes including authorization.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.api.dependencies.auth import get_current_doctor
from app.main import app

from tests.fixtures.factories import make_doctor, make_patient, make_consultation


def _override_auth(doctor):
    """
    Return a FastAPI dependency override that injects `doctor` as the
    authenticated user, bypassing Clerk JWT validation entirely.
    """
    async def _get_doctor():
        return doctor
    return _get_doctor


class TestCreateConsultationRoute:
    """POST /consultations/"""

    async def test_creates_consultation_returns_201(self, client, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        response = await client.post(
            "/consultations/",
            json={"patient_id": str(patient.id)},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "PENDING"
        assert data["patient_id"] == str(patient.id)
        assert data["doctor_id"] == str(doctor.id)

    async def test_returns_422_for_missing_patient_id(self, client, db_session):
        doctor = await make_doctor(db_session)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        response = await client.post("/consultations/", json={})

        assert response.status_code == 422

    async def test_returns_error_for_unowned_patient(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor_a.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_b)

        response = await client.post(
            "/consultations/",
            json={"patient_id": str(patient.id)},
        )

        # PatientNotOwnedException is now mapped to 403 via the exception handler
        assert response.status_code == 403


class TestGetConsultationRoute:
    """GET /consultations/{id}"""

    async def test_returns_consultation_for_owner(self, client, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        response = await client.get(f"/consultations/{consultation.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(consultation.id)
        assert data["status"] == "PENDING"

    async def test_returns_error_for_wrong_doctor(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor_a.id)
        consultation = await make_consultation(db_session, doctor_a.id, patient.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_b)

        response = await client.get(f"/consultations/{consultation.id}")

        # ConsultationNotFoundException is raised; the exception handler returns 404.
        assert response.status_code == 404

    async def test_returns_error_for_nonexistent_id(self, client, db_session):
        import uuid
        doctor = await make_doctor(db_session)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        response = await client.get(f"/consultations/{uuid.uuid4()}")

        assert response.status_code == 404


class TestListConsultationsRoute:
    """GET /consultations/?patient_id=..."""

    async def test_lists_consultations_for_patient(self, client, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        await make_consultation(db_session, doctor.id, patient.id)
        await make_consultation(db_session, doctor.id, patient.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        response = await client.get(f"/consultations/?patient_id={patient.id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_does_not_return_other_doctors_consultations(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)
        patient_b = await make_patient(db_session, doctor_b.id)
        await make_consultation(db_session, doctor_a.id, patient_a.id)
        await make_consultation(db_session, doctor_b.id, patient_b.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_a)

        response = await client.get(f"/consultations/?patient_id={patient_a.id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["doctor_id"] == str(doctor_a.id)


class TestAudioStreamWebSocketRoute:
    """WS /consultations/{consultation_id}/stream"""

    def test_websocket_rejects_unauthenticated_connection(self, db_session):
        from starlette.testclient import TestClient
        from starlette.websockets import WebSocketDisconnect
        import uuid

        with TestClient(app) as test_client:
            with pytest.raises(WebSocketDisconnect) as exc_info:
                with test_client.websocket_connect(f"/consultations/{uuid.uuid4()}/stream"):
                    pass
            assert exc_info.value.code == 1008

    @pytest.mark.asyncio
    async def test_websocket_rejects_wrong_doctor(self, client, db_session):
        from starlette.testclient import TestClient
        from starlette.websockets import WebSocketDisconnect
        from app.api.dependencies.auth import get_current_doctor_ws

        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)
        consultation_a = await make_consultation(db_session, doctor_a.id, patient_a.id)

        app.dependency_overrides[get_current_doctor_ws] = lambda: doctor_b

        with TestClient(app) as test_client:
            with pytest.raises(WebSocketDisconnect) as exc_info:
                with test_client.websocket_connect(f"/consultations/{consultation_a.id}/stream?token=valid_token"):
                    pass
            assert exc_info.value.code == 1008

        app.dependency_overrides.pop(get_current_doctor_ws, None)

    @pytest.mark.asyncio
    async def test_websocket_accepts_authorized_doctor(self, client, db_session, monkeypatch):
        from starlette.testclient import TestClient
        from app.api.dependencies.auth import get_current_doctor_ws
        from app.services.consultation_service import ConsultationService

        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        app.dependency_overrides[get_current_doctor_ws] = lambda: doctor

        # Mock save_audio_and_transcribe so it doesn't try to call Deepgram/S3 on disconnect
        monkeypatch.setattr(ConsultationService, "save_audio_and_transcribe", AsyncMock())

        with TestClient(app) as test_client:
            with test_client.websocket_connect(f"/consultations/{consultation.id}/stream?token=valid_token") as ws:
                ws.send_bytes(b"test audio bytes")
                ws.close()

        app.dependency_overrides.pop(get_current_doctor_ws, None)

