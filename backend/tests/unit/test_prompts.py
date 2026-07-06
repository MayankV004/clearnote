"""
tests/unit/test_prompts.py
──────────────────────────
Unit tests for the ChatPromptTemplate definitions in app/prompts/.

No API calls are made — these tests purely validate:
  1. Correct message count and roles produced by each template
  2. Variable injection works and appears in the right message
  3. Missing required variables raise a KeyError
"""
import pytest
from langchain_core.messages import SystemMessage, HumanMessage

from app.prompts.soap_extraction import SOAP_EXTRACTION_PROMPT
from app.prompts.drug_interaction import DRUG_INTERACTION_PROMPT


class TestSoapExtractionPrompt:

    def test_produces_two_messages(self):
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript="Patient has a headache.")
        assert len(messages) == 2

    def test_first_message_is_system(self):
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript="Patient has a headache.")
        assert isinstance(messages[0], SystemMessage)

    def test_second_message_is_human(self):
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript="Patient has a headache.")
        assert isinstance(messages[1], HumanMessage)

    def test_transcript_injected_into_human_message(self):
        transcript = "Patient reports right knee pain for two weeks."
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript=transcript)
        assert transcript in messages[1].content

    def test_system_message_contains_soap_field_definitions(self):
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript="x")
        system_text = messages[0].content
        for keyword in ("subjective", "objective", "assessment", "plan"):
            assert keyword in system_text.lower(), f"Expected '{keyword}' in system prompt"

    def test_system_message_contains_icd_guidance(self):
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript="x")
        assert "ICD-10" in messages[0].content

    def test_missing_transcript_raises(self):
        with pytest.raises(KeyError):
            SOAP_EXTRACTION_PROMPT.format_messages()


class TestDrugInteractionPrompt:

    _DEFAULTS = dict(
        drug_a="Ibuprofen",
        drug_b="Amlodipine",
        diag_context="Hypertension",
        context_str="No guideline chunks available.",
    )

    def test_produces_two_messages(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        assert len(messages) == 2

    def test_first_message_is_system(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        assert isinstance(messages[0], SystemMessage)

    def test_second_message_is_human(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        assert isinstance(messages[1], HumanMessage)

    def test_drug_names_injected_into_human_message(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        human_text = messages[1].content
        assert "Ibuprofen" in human_text
        assert "Amlodipine" in human_text

    def test_diag_context_injected(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        assert "Hypertension" in messages[1].content

    def test_context_str_injected(self):
        context = "WHO EML 2023: NSAIDs may reduce antihypertensive efficacy."
        messages = DRUG_INTERACTION_PROMPT.format_messages(**{**self._DEFAULTS, "context_str": context})
        assert context in messages[1].content

    def test_system_contains_severity_levels(self):
        messages = DRUG_INTERACTION_PROMPT.format_messages(**self._DEFAULTS)
        for level in ("NONE", "MILD", "MODERATE", "SEVERE"):
            assert level in messages[0].content

    def test_missing_variable_raises(self):
        with pytest.raises(KeyError):
            DRUG_INTERACTION_PROMPT.format_messages(drug_a="Ibuprofen")  # missing drug_b etc.
