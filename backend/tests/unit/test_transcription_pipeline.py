"""
tests/unit/test_transcription_pipeline.py
──────────────────────────────────────────
Unit tests for the _run_transcription background task.

This is the most critical flow in the application:
  PENDING → PROCESSING → (Deepgram) → (LLM) → COMPLETE
                                              ↘ FAILED  (on error)

All external I/O (S3, Deepgram, Groq) is mocked so these tests run
instantly with no network access and no real API keys needed.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.future import select

from app.models.consultation import Consultation, ConsultationStatus
from app.models.soap_note import SOAPNote
from app.models.medication import Medication
from app.models.diagnosis import Diagnosis
from app.services.consultation_service import _run_transcription
from app.schemas.llm import SOAPExtractionResult, MedicationSchema, DiagnosisSchema
from app.services.deepgram_service import TranscriptionResult

from tests.fixtures.factories import make_doctor, make_patient, make_consultation


# ── Helpers ──────────────────────────────────────────────────────────────────

SAMPLE_TRANSCRIPT = (
    "Patient reports a severe headache lasting 3 days. "
    "Prescribed Ibuprofen 400mg twice daily for 5 days orally. "
    "Diagnosis: Acute tension headache (G44.2)."
)

SAMPLE_SOAP = SOAPExtractionResult(
    subjective="Severe headache for 3 days",
    objective="No fever, BP normal",
    assessment="Acute tension headache",
    plan="Ibuprofen 400mg twice daily for 5 days",
    medications=[
        MedicationSchema(
            name="Ibuprofen",
            dosage="400mg",
            frequency="twice daily",
            duration="5 days",
            route="oral",
        )
    ],
    diagnoses=[
        DiagnosisSchema(icd_code="G44.2", description="Tension-type headache")
    ],
    allergies=[],
    confidence=0.97,
)


def _mock_deepgram(mocker, transcript: str = SAMPLE_TRANSCRIPT):
    """Patch deepgram_service.transcribe_audio to return a successful result."""
    return mocker.patch(
        "app.services.deepgram_service.deepgram_service.transcribe_audio",
        new_callable=AsyncMock,
        return_value=TranscriptionResult(
            transcript=transcript,
            confidence=0.95,
            words=[],
            duration_seconds=30.0,
        ),
    )


def _mock_s3_download(mocker, audio_bytes: bytes = b"fake_audio_bytes"):
    """Patch s3_service.download_audio to return fake bytes."""
    return mocker.patch(
        "app.services.s3_service.s3_service.download_audio",
        new_callable=AsyncMock,
        return_value=audio_bytes,
    )


def _mock_llm(mocker, result: SOAPExtractionResult = SAMPLE_SOAP):
    """Patch llm_service.extract_structured_data to return structured SOAP."""
    return mocker.patch(
        "app.services.llm_service.llm_service.extract_structured_data",
        new_callable=AsyncMock,
        return_value=result,
    )


def _mock_db_session_factory(mocker, db_session):
    """
    Patch AsyncSessionLocal so _run_transcription uses our test session
    instead of opening a real connection to Postgres.

    _run_transcription does `from app.db.session import AsyncSessionLocal` as
    a local import, so we must patch it in the app.db.session module itself
    (which is where the name is resolved at import time).
    """
    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=False)

    mocker.patch(
        "app.db.session.AsyncSessionLocal",
        return_value=mock_ctx,
    )


# ═════════════════════════════════════════════════════════════════════════════
# TEST CASES
# ═════════════════════════════════════════════════════════════════════════════


class TestTranscriptionPipelineSuccess:
    """Happy-path: full pipeline runs, status transitions to COMPLETE."""

    async def test_status_transitions_to_complete(self, db_session, mocker):
        """
        THE most important test: after _run_transcription finishes, the
        consultation status must be COMPLETE in the DB.
        This was the core bug — the status was stuck at PROCESSING forever.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        # Re-fetch from DB and assert final state
        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.AWAITING_REVIEW, (
            f"Expected AWAITING_REVIEW but got {refreshed.status}."
        )

    async def test_soap_note_is_created(self, db_session, mocker):
        """A SOAPNote row must be persisted after a successful transcription."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        soap = await db_session.scalar(
            select(SOAPNote).where(SOAPNote.consultation_id == consultation.id)
        )
        assert soap is not None, "SOAPNote was not created"
        assert soap.raw_transcript == SAMPLE_TRANSCRIPT
        assert soap.subjective == SAMPLE_SOAP.subjective
        assert soap.assessment == SAMPLE_SOAP.assessment

    async def test_medications_are_saved(self, db_session, mocker):
        """Medications extracted by the LLM must be saved to the medications table."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        result = await db_session.execute(
            select(Medication).where(Medication.consultation_id == consultation.id)
        )
        meds = result.scalars().all()
        assert len(meds) == 1
        assert meds[0].name == "Ibuprofen"
        assert meds[0].dosage == "400mg"

    async def test_diagnoses_are_saved(self, db_session, mocker):
        """Diagnoses extracted by the LLM must be saved to the diagnoses table."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        result = await db_session.execute(
            select(Diagnosis).where(Diagnosis.consultation_id == consultation.id)
        )
        diagnoses = result.scalars().all()
        assert len(diagnoses) == 1
        assert diagnoses[0].icd_code == "G44.2"

    async def test_intermediate_status_is_processing(self, db_session, mocker):
        """
        While the pipeline is running, the status should move to PROCESSING
        before the final COMPLETE commit.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        processing_was_set = []

        async def capturing_download(s3_key):
            # At this point in the pipeline, status should already be PROCESSING
            refreshed = await db_session.scalar(
                select(Consultation).where(Consultation.id == consultation.id)
            )
            processing_was_set.append(refreshed.status)
            return b"fake_audio"

        _mock_db_session_factory(mocker, db_session)
        mocker.patch(
            "app.services.s3_service.s3_service.download_audio",
            side_effect=capturing_download,
        )
        _mock_deepgram(mocker)
        _mock_llm(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        assert ConsultationStatus.PROCESSING in processing_was_set, (
            "Status was never set to PROCESSING during pipeline execution"
        )


class TestTranscriptionPipelineFailure:
    """Error-path tests: status must transition to FAILED, never stay at PROCESSING."""

    async def test_empty_transcript_sets_failed(self, db_session, mocker):
        """
        When Deepgram returns an empty transcript, the consultation status
        must be set to FAILED — not left hanging at PROCESSING.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        # Return empty transcript — simulates silent audio / too-short recording
        mocker.patch(
            "app.services.deepgram_service.deepgram_service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=TranscriptionResult(
                transcript="",   # ← empty
                confidence=0.0,
            ),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED, (
            f"Expected FAILED for empty transcript, got {refreshed.status}"
        )
        assert refreshed.processing_error is not None
        assert "empty" in refreshed.processing_error.lower()

    async def test_s3_download_failure_sets_failed(self, db_session, mocker):
        """If S3 download raises, the status must become FAILED."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        mocker.patch(
            "app.services.s3_service.s3_service.download_audio",
            new_callable=AsyncMock,
            side_effect=Exception("S3 bucket not found"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED
        assert "S3 bucket not found" in refreshed.processing_error

    async def test_deepgram_exception_sets_failed(self, db_session, mocker):
        """If the Deepgram API call raises, status must become FAILED."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        mocker.patch(
            "app.services.deepgram_service.deepgram_service.transcribe_audio",
            new_callable=AsyncMock,
            side_effect=Exception("Deepgram API rate limit"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED
        assert "Deepgram API rate limit" in refreshed.processing_error

    async def test_status_never_stays_processing_on_failure(self, db_session, mocker):
        """
        Core regression test for the original bug:
        After ANY failure, status must NOT remain as PROCESSING.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        # LLM raises an unexpected error
        mocker.patch(
            "app.services.llm_service.llm_service.extract_structured_data",
            new_callable=AsyncMock,
            side_effect=RuntimeError("LLM service unavailable"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status != ConsultationStatus.PROCESSING, (
            "BUG: Status is stuck at PROCESSING after a pipeline failure! "
            "This is the infinite-polling bug."
        )
        assert refreshed.status == ConsultationStatus.FAILED

    async def test_nonexistent_consultation_does_not_raise(self, db_session, mocker):
        """_run_transcription must handle a missing consultation_id gracefully."""
        _mock_db_session_factory(mocker, db_session)
        # Should return silently without raising
        await _run_transcription("00000000-0000-0000-0000-000000000000", "audio/ghost.webm")
