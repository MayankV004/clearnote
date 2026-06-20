"""
tests/unit/test_llm_service.py
───────────────────────────────
Unit tests for LLMService.extract_structured_data.

The Groq client is mocked — no real API calls are made.
We test: valid extraction, malformed JSON handling, and empty response.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.llm_service import LLMService
from app.schemas.llm import SOAPExtractionResult


def _make_groq_response(content: str):
    """Build a minimal object that mirrors the Groq SDK response structure."""
    message = MagicMock()
    message.content = content
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


VALID_LLM_JSON = json.dumps({
    "subjective": "Patient has headache",
    "objective": "BP 120/80, temp 98.6F",
    "assessment": "Tension headache",
    "plan": "Ibuprofen 400mg twice daily",
    "medications": [
        {
            "name": "Ibuprofen",
            "dosage": "400mg",
            "frequency": "twice daily",
            "duration": "5 days",
            "route": "oral",
        }
    ],
    "diagnoses": [
        {"icd_code": "G44.2", "description": "Tension-type headache"}
    ],
    "allergies": [],
    "confidence": 0.95,
})


class TestLLMServiceExtraction:

    async def test_extracts_structured_data_from_valid_response(self, mocker):
        service = LLMService()
        mock_response = _make_groq_response(VALID_LLM_JSON)

        # Set _client directly — can't patch a @property with patch.object
        mock_groq_client = MagicMock()
        mock_groq_client.chat.completions.create = AsyncMock(return_value=mock_response)
        service._client = mock_groq_client

        result = await service.extract_structured_data("Patient has headache")

        assert isinstance(result, SOAPExtractionResult)
        assert result.subjective == "Patient has headache"
        assert len(result.medications) == 1
        assert result.medications[0].name == "Ibuprofen"
        assert result.diagnoses[0].icd_code == "G44.2"

    async def test_returns_fallback_on_api_exception(self, mocker):
        """
        If Groq raises (rate limit, network error, etc.), we must return a
        fallback SOAPExtractionResult — never let the pipeline crash uncaught.
        """
        service = LLMService()
        mock_groq_client = MagicMock()
        mock_groq_client.chat.completions.create = AsyncMock(
            side_effect=Exception("Groq rate limit exceeded")
        )
        service._client = mock_groq_client

        result = await service.extract_structured_data("some transcript")

        assert isinstance(result, SOAPExtractionResult)
        # Fallback should indicate failure, not crash
        assert "LLM Extraction failed" in result.subjective
        assert result.confidence == 0.0

    async def test_returns_fallback_on_malformed_json(self, mocker):
        """If Groq returns invalid JSON, we should get a graceful fallback."""
        service = LLMService()
        mock_response = _make_groq_response("this is not valid JSON {{{")

        mock_groq_client = MagicMock()
        mock_groq_client.chat.completions.create = AsyncMock(return_value=mock_response)
        service._client = mock_groq_client

        result = await service.extract_structured_data("transcript text")

        assert isinstance(result, SOAPExtractionResult)
        assert result.confidence == 0.0

    async def test_returns_fallback_on_empty_content(self, mocker):
        """Empty content from Groq should produce a fallback, not a crash."""
        service = LLMService()
        mock_response = _make_groq_response("")

        mock_groq_client = MagicMock()
        mock_groq_client.chat.completions.create = AsyncMock(return_value=mock_response)
        service._client = mock_groq_client

        result = await service.extract_structured_data("transcript text")

        assert isinstance(result, SOAPExtractionResult)
