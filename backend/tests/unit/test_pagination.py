"""
test_pagination.py

Tests for TICKET-15 / FLOW-02: Roster and consultation pagination with X-Total-Count headers.
"""

import pytest
from app.main import app
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
class TestPagination:
    """Verifies limit/offset pagination and total count headers for patients and consultations."""

    async def test_patient_roster_pagination(self, client, db_session):
        doctor = await make_doctor(db_session)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        # Seed 5 patients
        patients = []
        for i in range(5):
            p = await make_patient(db_session, doctor.id, name=f"Patient {i}", email=f"patient_{i}@example.com")
            patients.append(p)

        # Page 1 with page_size=2
        res1 = await client.get("/patients/?page=1&page_size=2")
        assert res1.status_code == 200
        data1 = res1.json()
        assert len(data1) == 2
        assert res1.headers.get("x-total-count") == "5"
        assert res1.headers.get("x-page") == "1"
        assert res1.headers.get("x-page-size") == "2"

        # Page 2 with page_size=2
        res2 = await client.get("/patients/?page=2&page_size=2")
        assert res2.status_code == 200
        data2 = res2.json()
        assert len(data2) == 2
        assert res2.headers.get("x-total-count") == "5"

        # Page 3 with page_size=2
        res3 = await client.get("/patients/?page=3&page_size=2")
        assert res3.status_code == 200
        data3 = res3.json()
        assert len(data3) == 1
        assert res3.headers.get("x-total-count") == "5"

    async def test_consultation_roster_pagination(self, client, db_session):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        app.dependency_overrides[get_current_doctor] = _override_auth(doctor)

        # Seed 3 consultations
        for _ in range(3):
            await make_consultation(db_session, doctor.id, patient.id)

        res = await client.get(f"/consultations/?patient_id={patient.id}&page=1&page_size=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 2
        assert res.headers.get("x-total-count") == "3"
        assert res.headers.get("x-page") == "1"
        assert res.headers.get("x-page-size") == "2"
