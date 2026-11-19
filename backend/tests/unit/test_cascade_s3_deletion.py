"""
test_cascade_s3_deletion.py

Tests for TICKET-07 / DATA-03: Cascade S3 file deletion upon patient data erasure.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.main import app
from app.api.dependencies.auth import get_current_doctor
from app.models.consultation import Consultation, ConsultationStatus
from tests.fixtures.factories import make_doctor, make_patient


def _override_auth(doctor):
    from starlette.requests import Request
    async def _get_doctor(request: Request = None):
        if request is not None:
            request.state.user_id = str(doctor.id)
        return doctor
    return _get_doctor


@pytest.mark.asyncio
class TestCascadeS3Deletion:
    """Verifies that patient data deletion purges all consultation audio and PDFs in S3."""

    async def test_process_deletion_deletes_associated_s3_audio_and_pdf(self, client, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)

        # Create consultation belonging to patient with S3 keys
        consultation = Consultation(
            doctor_id=doctor.id,
            patient_id=patient.id,
            status=ConsultationStatus.COMPLETE,
            audio_s3_key="audio/test-cascade-123.webm",
            prescription_s3_key="prescriptions/test-cascade-123.pdf",
        )
        db_session.add(consultation)
        await db_session.commit()

        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        # 1. Request deletion
        req_res = await client.post("/data-deletion/", json={"patient_id": str(patient.id)})
        assert req_res.status_code == 201
        req_id = req_res.json()["id"]

        # 2. Process deletion with mocked S3 service
        with patch("app.api.routes.data_deletion.s3_service.delete_audio", new=AsyncMock()) as mock_del_audio, \
             patch("app.api.routes.data_deletion.s3_service.delete_pdf", new=AsyncMock()) as mock_del_pdf:

            process_res = await client.post(f"/data-deletion/{req_id}/process")
            assert process_res.status_code == 200

            # Verify both audio and PDF S3 deletion methods were invoked with correct keys
            mock_del_audio.assert_awaited_once_with("audio/test-cascade-123.webm")
            mock_del_pdf.assert_awaited_once_with("prescriptions/test-cascade-123.pdf")
