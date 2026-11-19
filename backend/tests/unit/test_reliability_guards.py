"""
test_reliability_guards.py

Tests for Phase 3 Reliability:
- Idempotency in background consultation processing
- Deep health check endpoint probing DB connectivity
- RAG metadata filtering and re-index capabilities
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.models.consultation import Consultation, ConsultationStatus
from app.services.consultation_service import _run_transcription
from app.services.rag_service import RAGService
from app.models.guideline_chunk import GuidelineChunk
from tests.fixtures.factories import make_doctor, make_patient


@pytest.mark.asyncio
class TestReliabilityGuards:
    """Verifies idempotency, health check probe, and RAG metadata filters."""

    async def test_health_check_probes_database(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "ok"
        assert "version" in data

    async def test_run_transcription_idempotency_skips_active_consultation(self, db_session, mocker):
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)

        consultation = Consultation(
            doctor_id=doctor.id,
            patient_id=patient.id,
            status=ConsultationStatus.PROCESSING,
            audio_s3_key="audio/already-processing.webm",
        )
        db_session.add(consultation)
        await db_session.commit()

        mock_ctx = MagicMock()
        mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        mocker.patch("app.db.session.AsyncSessionLocal", return_value=mock_ctx)

        # Attempt to run background processing on already PROCESSING consultation
        with patch("app.services.s3_service.s3_service.download_audio", new=AsyncMock()) as mock_s3:
            await _run_transcription(str(consultation.id), "audio/already-processing.webm")
            # Should have skipped immediately without calling S3
            mock_s3.assert_not_called()

    async def test_rag_metadata_source_filter(self, db_session):
        service = RAGService()
        chunk = GuidelineChunk(
            source="Cardiology_Guidelines_2025.pdf",
            page=12,
            content="Amlodipine interacts with Simvastatin.",
            embedding=[0.01] * 768,
        )
        db_session.add(chunk)
        await db_session.commit()

        med_mock_a = MagicMock()
        med_mock_a.name = "Amlodipine"
        med_mock_b = MagicMock()
        med_mock_b.name = "Simvastatin"

        with patch.object(service, "get_embedding", new=AsyncMock(return_value=[0.01] * 768)), \
             patch.object(service.groq_client.chat.completions, "create", new=AsyncMock()) as mock_groq:
            
            mock_completion = MagicMock()
            mock_choice = MagicMock()
            mock_choice.message.content = '{"severity": "MILD", "mechanism": "CYP3A4 inhibition", "recommendation": "Limit simvastatin to 20mg", "source_reference": "Cardiology Guidelines p.12", "confidence": 0.92}'
            mock_completion.choices = [mock_choice]
            mock_groq.return_value = mock_completion

            # Call with source filter matching our chunk
            await service.check_drug_interactions(
                consultation_id="11111111-1111-1111-1111-111111111111",
                medications=[med_mock_a, med_mock_b],
                diagnoses=[],
                db=db_session,
                source_filter="Cardiology"
            )
            assert mock_groq.called
