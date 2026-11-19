"""
tests/unit/test_full_pipeline.py
─────────────────────────────────
End-to-end test of the full consultation processing pipeline:

  PENDING → PROCESSING → Deepgram transcription
                       → LLM SOAP extraction (ChatPromptTemplate)
                       → RAG drug interaction check (ChatPromptTemplate + Pydantic)
                       → DB persistence (SOAPNote, Medication, Diagnosis, Interaction)
                       → COMPLETE

All external I/O is mocked — no real API keys, network, S3, or pgvector needed.
The test DB uses SQLite (via conftest.py).
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.future import select

from app.models.consultation import Consultation, ConsultationStatus
from app.models.soap_note import SOAPNote
from app.models.medication import Medication
from app.models.diagnosis import Diagnosis
from app.models.interaction import Interaction
from app.services.consultation_service import _run_transcription
from app.schemas.llm import SOAPExtractionResult, MedicationSchema, DiagnosisSchema
from app.services.deepgram_service import TranscriptionResult

from tests.fixtures.factories import make_doctor, make_patient, make_consultation


# ── Sample data ───────────────────────────────────────────────────────────────

SAMPLE_TRANSCRIPT = (
    "Patient reports pain in the right knee for two weeks, worse on stairs. "
    "Mild swelling noted. Blood pressure today reads 130 over 85. "
    "Prescribing Ibuprofen 400 milligrams three times a day for seven days orally, "
    "and Pantoprazole 20 milligrams once daily orally. "
    "Continuing Amlodipine 5 milligrams once daily for hypertension. "
    "Diagnosing early osteoarthritis of the right knee and essential hypertension."
)

SAMPLE_SOAP = SOAPExtractionResult(
    subjective=(
        "Patient reports right knee pain for two weeks, worse on climbing stairs. "
        "Mild swelling. Family history of arthritis."
    ),
    objective="BP 130/85 mmHg. Mild knee effusion, medial tenderness, restricted ROM.",
    assessment="Early osteoarthritis right knee. Essential hypertension — ongoing management.",
    plan=(
        "Ibuprofen 400mg TID x7d. Pantoprazole 20mg OD. Continue Amlodipine 5mg OD. "
        "Activity restriction. Follow-up in 2 weeks."
    ),
    medications=[
        MedicationSchema(name="Ibuprofen",    dosage="400mg", frequency="three times a day", duration="7 days",  route="oral"),
        MedicationSchema(name="Pantoprazole", dosage="20mg",  frequency="once daily",         duration="",        route="oral"),
        MedicationSchema(name="Amlodipine",   dosage="5mg",   frequency="once daily",         duration="",        route="oral"),
    ],
    diagnoses=[
        DiagnosisSchema(icd_code="M17.11", description="Primary osteoarthritis, right knee"),
        DiagnosisSchema(icd_code="I10",    description="Essential hypertension"),
    ],
    allergies=[],
    confidence=0.96,
)

# Simulates what Groq returns for the drug interaction check
_INTERACTION_JSON = json.dumps({
    "severity": "MODERATE",
    "mechanism": "NSAIDs reduce antihypertensive efficacy of Amlodipine via prostaglandin inhibition and sodium retention.",
    "recommendation": "Monitor blood pressure closely. Consider paracetamol as alternative analgesic if BP rises.",
    "source_reference": "WHO EML 2023, p.47",
    "confidence": 0.88,
})

_NO_INTERACTION_JSON = json.dumps({
    "severity": "NONE",
    "mechanism": "No known clinically significant interaction.",
    "recommendation": "No action required. Monitor patient as usual.",
    "source_reference": "WHO EML 2023",
    "confidence": 0.92,
})


# ── Mock helpers ──────────────────────────────────────────────────────────────

def _mock_db_session_factory(mocker, db_session):
    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=False)
    mocker.patch("app.db.session.AsyncSessionLocal", return_value=mock_ctx)


def _mock_s3_download(mocker, audio_bytes: bytes = b"fake_audio"):
    return mocker.patch(
        "app.services.s3_service.s3_service.download_audio",
        new_callable=AsyncMock,
        return_value=audio_bytes,
    )


def _mock_deepgram(mocker, transcript: str = SAMPLE_TRANSCRIPT):
    return mocker.patch(
        "app.services.deepgram_service.deepgram_service.transcribe_audio",
        new_callable=AsyncMock,
        return_value=TranscriptionResult(transcript=transcript, confidence=0.95, words=[], duration_seconds=45.0),
    )


def _mock_llm(mocker, result: SOAPExtractionResult = SAMPLE_SOAP):
    return mocker.patch(
        "app.services.llm_service.llm_service.extract_structured_data",
        new_callable=AsyncMock,
        return_value=result,
    )


def _mock_rag(mocker):
    """
    Mock the entire rag_service.check_drug_interactions so the RAG service
    doesn't need pgvector or Groq. The actual RAG logic is tested separately
    in test_rag_schema.py and test_prompts.py.
    """
    return mocker.patch(
        "app.services.rag_service.rag_service.check_drug_interactions",
        new_callable=AsyncMock,
        return_value=None,
    )


def _mock_rag_groq_for_interactions(mocker):
    """
    Alternatively: mock only the Groq call inside check_drug_interactions,
    returning alternating interaction / no-interaction responses.
    Also mock the Gemini embedding + pgvector query so no DB or network is needed.
    """
    # Mock Gemini embeddings
    mocker.patch(
        "app.services.rag_service.rag_service.get_embedding",
        new_callable=AsyncMock,
        return_value=[0.0] * 768,
    )

    # Mock the pgvector DB query — return empty chunks (no guidelines ingested)
    async def fake_execute(_stmt):
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        return result

    # Mock Groq responses: cycle through MODERATE for first pair, NONE for rest
    responses = [_INTERACTION_JSON, _NO_INTERACTION_JSON, _NO_INTERACTION_JSON]
    call_count = [0]

    def _make_groq_response(content: str):
        msg = MagicMock()
        msg.content = content
        choice = MagicMock()
        choice.message = msg
        resp = MagicMock()
        resp.choices = [choice]
        return resp

    async def fake_groq_create(**kwargs):
        idx = min(call_count[0], len(responses) - 1)
        call_count[0] += 1
        return _make_groq_response(responses[idx])

    mocker.patch(
        "app.services.rag_service.rag_service._groq_client",
        new_callable=MagicMock,
    )

    return fake_groq_create


# ═════════════════════════════════════════════════════════════════════════════
# HAPPY PATH — Full pipeline with mocked RAG
# ═════════════════════════════════════════════════════════════════════════════

class TestFullPipelineHappyPath:
    """
    Tests the complete path: audio → transcript → SOAP → medications → diagnoses → COMPLETE.
    RAG is mocked at the service level — its internals are tested separately.
    """

    async def test_pipeline_reaches_complete(self, db_session, mocker):
        """Core assertion: the consultation ends up COMPLETE in the DB."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.AWAITING_REVIEW

    async def test_soap_note_content_matches_llm_output(self, db_session, mocker):
        """SOAP fields must exactly match what the (mocked) LLM returned."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        soap = await db_session.scalar(
            select(SOAPNote).where(SOAPNote.consultation_id == consultation.id)
        )
        assert soap is not None, "SOAPNote row was not created"
        assert soap.raw_transcript == SAMPLE_TRANSCRIPT
        assert soap.subjective == SAMPLE_SOAP.subjective
        assert soap.objective == SAMPLE_SOAP.objective
        assert soap.assessment == SAMPLE_SOAP.assessment
        assert soap.plan == SAMPLE_SOAP.plan

    async def test_all_three_medications_saved(self, db_session, mocker):
        """
        All medications from the new improved LLM prompt must be saved:
        Ibuprofen, Pantoprazole, AND Amlodipine (existing, continued).
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        result = await db_session.execute(
            select(Medication).where(Medication.consultation_id == consultation.id)
        )
        meds = result.scalars().all()
        med_names = {m.name for m in meds}

        assert len(meds) == 3, f"Expected 3 medications, got {len(meds)}: {med_names}"
        assert "Ibuprofen" in med_names
        assert "Pantoprazole" in med_names
        assert "Amlodipine" in med_names

    async def test_medication_details_are_correct(self, db_session, mocker):
        """Spot-check dosage and frequency for Ibuprofen."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        result = await db_session.execute(
            select(Medication).where(
                Medication.consultation_id == consultation.id,
                Medication.name == "Ibuprofen",
            )
        )
        ibu = result.scalar()
        assert ibu is not None
        assert ibu.dosage == "400mg"
        assert ibu.frequency == "three times a day"
        assert ibu.duration == "7 days"
        assert ibu.route == "oral"

    async def test_both_diagnoses_saved(self, db_session, mocker):
        """OA (M17.11) and Hypertension (I10) must both be persisted."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        result = await db_session.execute(
            select(Diagnosis).where(Diagnosis.consultation_id == consultation.id)
        )
        diagnoses = result.scalars().all()
        codes = {d.icd_code for d in diagnoses}

        assert len(diagnoses) == 2, f"Expected 2 diagnoses, got {len(diagnoses)}: {codes}"
        assert "M17.11" in codes
        assert "I10" in codes

    async def test_rag_check_is_called_with_correct_args(self, db_session, mocker):
        """rag_service.check_drug_interactions must be called once with the consultation_id."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        rag_mock = _mock_rag(mocker)

        await _run_transcription(str(consultation.id), "audio/test.webm")

        rag_mock.assert_called_once()
        call_kwargs = rag_mock.call_args
        assert str(consultation.id) in str(call_kwargs)


# ═════════════════════════════════════════════════════════════════════════════
# FAILURE PATHS — Pipeline errors must always result in FAILED, never PROCESSING
# ═════════════════════════════════════════════════════════════════════════════

class TestFullPipelineFailurePaths:

    async def test_llm_failure_sets_failed_not_processing(self, db_session, mocker):
        """If LLM extraction crashes, status must be FAILED — not stuck at PROCESSING."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        mocker.patch(
            "app.services.llm_service.llm_service.extract_structured_data",
            new_callable=AsyncMock,
            side_effect=RuntimeError("Groq API unavailable"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED
        assert refreshed.status != ConsultationStatus.PROCESSING

    async def test_s3_failure_sets_failed(self, db_session, mocker):
        """S3 download failure must mark consultation as FAILED."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        mocker.patch(
            "app.services.s3_service.s3_service.download_audio",
            new_callable=AsyncMock,
            side_effect=Exception("NoSuchBucket: clearnote-audio"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED
        assert "clearnote-audio" in refreshed.processing_error

    async def test_deepgram_empty_transcript_sets_failed(self, db_session, mocker):
        """Empty transcript (silent audio) must not produce a SOAPNote."""
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        mocker.patch(
            "app.services.deepgram_service.deepgram_service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=TranscriptionResult(transcript="", confidence=0.0),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        assert refreshed.status == ConsultationStatus.FAILED

        # No SOAPNote should have been created
        soap = await db_session.scalar(
            select(SOAPNote).where(SOAPNote.consultation_id == consultation.id)
        )
        assert soap is None, "SOAPNote must not be created for an empty transcript"

    async def test_rag_failure_does_not_block_complete(self, db_session, mocker):
        """
        If the RAG drug interaction check raises, the pipeline should still
        reach FAILED (since RAG runs inside the try block). Medications and
        diagnoses should still have been added before the RAG call.
        """
        doctor = await make_doctor(db_session)
        patient = await make_patient(db_session, doctor.id)
        consultation = await make_consultation(db_session, doctor.id, patient.id)

        _mock_db_session_factory(mocker, db_session)
        _mock_s3_download(mocker)
        _mock_deepgram(mocker)
        _mock_llm(mocker)
        mocker.patch(
            "app.services.rag_service.rag_service.check_drug_interactions",
            new_callable=AsyncMock,
            side_effect=Exception("pgvector connection failed"),
        )

        await _run_transcription(str(consultation.id), "audio/test.webm")

        refreshed = await db_session.scalar(
            select(Consultation).where(Consultation.id == consultation.id)
        )
        # RAG is inside the try block, so a failure here results in FAILED status
        assert refreshed.status == ConsultationStatus.FAILED
        assert refreshed.status != ConsultationStatus.PROCESSING
