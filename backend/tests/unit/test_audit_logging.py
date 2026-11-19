import pytest
import asyncio
from sqlalchemy.future import select
from app.models.audit_log import AuditLog
from app.api.dependencies.auth import get_current_doctor
from app.main import app
from tests.fixtures.factories import make_doctor, make_patient

from fastapi import Request

@pytest.mark.asyncio
async def test_audit_log_recorded_for_mutating_request(client, db_session):
    doctor = await make_doctor(db_session)
    patient = await make_patient(db_session, doctor.id)

    def _override_auth(request: Request):
        request.state.user_id = str(doctor.id)
        return doctor

    app.dependency_overrides[get_current_doctor] = _override_auth

    # Send a POST request which should trigger audit logging
    response = await client.post(
        "/consultations/",
        json={"patient_id": str(patient.id)},
    )
    assert response.status_code == 201

    # Give the background task a moment to execute write_audit_log
    await asyncio.sleep(0.1)

    # Check if audit_log row was created with doctor.id
    stmt = select(AuditLog).where(AuditLog.user_id == str(doctor.id))
    result = await db_session.execute(stmt)
    log = result.scalar_one_or_none()

    assert log is not None, "AuditLog entry was not created"
    assert log.action == "POST"
    assert log.target_resource == "/consultations/"
    assert log.status_code == 201
