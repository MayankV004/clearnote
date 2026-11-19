import pytest
from app.main import app
from app.api.dependencies.auth import get_current_doctor
from tests.fixtures.factories import make_doctor, make_patient

def _override_auth(doctor):
    from starlette.requests import Request
    async def _get_doctor(request: Request = None):
        if request is not None:
            request.state.user_id = str(doctor.id)
        return doctor
    return _get_doctor

@pytest.mark.asyncio
class TestDataDeletionTenantIsolation:
    """Tests enforcing tenant isolation on /data-deletion routes."""

    async def test_doctor_cannot_request_deletion_for_other_doctors_patient(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)

        # Doctor B attempts to request deletion of Doctor A's patient
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_b)

        response = await client.post(
            "/data-deletion/",
            json={"patient_id": str(patient_a.id)},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Patient not found"

    async def test_doctor_cannot_process_other_doctors_deletion_request(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)

        # Doctor A creates deletion request
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_a)
        res = await client.post("/data-deletion/", json={"patient_id": str(patient_a.id)})
        assert res.status_code == 201
        req_id = res.json()["id"]

        # Doctor B tries to process Doctor A's deletion request
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_b)
        process_res = await client.post(f"/data-deletion/{req_id}/process")
        assert process_res.status_code == 404

    async def test_doctor_only_lists_own_deletion_requests(self, client, db_session):
        doctor_a = await make_doctor(db_session)
        doctor_b = await make_doctor(db_session)
        patient_a = await make_patient(db_session, doctor_a.id)
        patient_b = await make_patient(db_session, doctor_b.id)

        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_a)
        await client.post("/data-deletion/", json={"patient_id": str(patient_a.id)})

        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_b)
        await client.post("/data-deletion/", json={"patient_id": str(patient_b.id)})

        # List as Doctor A
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor_a)
        res = await client.get("/data-deletion/")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["doctor_id"] == str(doctor_a.id)
