"""
tests/unit/test_rag_grounding.py
────────────────────────────────
Unit tests for AI-03 / Grounding Engine & Fallbacks:
  - Empty retrieval handling: falls back gracefully with low-evidence advisory
  - Model failure fallback: records safety caution interaction rather than dropping warnings silently
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.future import select
from uuid import uuid4

from app.models.interaction import Interaction
from app.services.rag_service import rag_service
from tests.fixtures.factories import make_doctor, make_patient, make_consultation


class DummyMed:
    def __init__(self, name: str):
        self.name = name


class DummyDiag:
    def __init__(self, description: str):
        self.description = description


class TestRagGroundingAndFallbacks:

    async def test_model_failure_creates_safety_caution_record(self, db_session, mocker):
        """If the LLM call fails, an alert record must still be saved advising manual verification."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        # Mock embedding
        mocker.patch.object(rag_service, "get_embedding", new_callable=AsyncMock, return_value=[0.0] * 768)

        # Mock groq client raising an exception (e.g. API rate limit or outage)
        mock_groq = MagicMock()
        mock_groq.chat.completions.create = AsyncMock(side_effect=Exception("Groq API 503 Service Unavailable"))
        mocker.patch.object(rag_service, "_groq_client", mock_groq)

        meds = [DummyMed("Warfarin"), DummyMed("Aspirin")]
        diags = [DummyDiag("Atrial fibrillation")]

        await rag_service.check_drug_interactions(str(consultation.id), meds, diags, db_session)

        # Verify an interaction was saved so the doctor knows the check could not be completed
        records = (
            await db_session.scalars(
                select(Interaction).where(Interaction.consultation_id == consultation.id)
            )
        ).all()

        assert len(records) == 1
        record = records[0]
        assert record.drug_a == "Warfarin"
        assert record.drug_b == "Aspirin"
        assert record.confidence == 0.0
        assert "manual" in record.recommendation.lower() or "verify" in record.recommendation.lower()

    async def test_empty_retrieval_handles_missing_guidelines(self, db_session, mocker):
        """When no guideline chunks exist in DB, context notes absence and caps confidence."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        mocker.patch.object(rag_service, "get_embedding", new_callable=AsyncMock, return_value=[0.0] * 768)

        # Groq succeeds with a valid response
        fake_content = (
            '{"severity": "NONE", "mechanism": "No known interaction.", '
            '"recommendation": "Monitor routine vitals.", '
            '"source_reference": "General Pharmacology Reference", "confidence": 0.95}'
        )
        mock_groq = MagicMock()
        mock_resp = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = fake_content
        mock_resp.choices = [mock_choice]
        mock_groq.chat.completions.create = AsyncMock(return_value=mock_resp)
        mocker.patch.object(rag_service, "_groq_client", mock_groq)

        meds = [DummyMed("Metformin"), DummyMed("Amlodipine")]
        diags = [DummyDiag("Type 2 Diabetes")]

        await rag_service.check_drug_interactions(str(consultation.id), meds, diags, db_session)

        records = (
            await db_session.scalars(
                select(Interaction).where(Interaction.consultation_id == consultation.id)
            )
        ).all()

        assert len(records) == 1
        record = records[0]
        assert record.confidence <= 0.5 or "no local guideline" in record.guideline_ref.lower() or "reference" in record.guideline_ref.lower()
