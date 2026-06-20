"""
tests/unit/test_deepgram_service.py
─────────────────────────────────────
Unit tests for DeepgramService in isolation.

The Deepgram SDK client is mocked — no network calls are made.
We test: response parsing, empty-transcript detection, and API error handling.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.deepgram_service import DeepgramService, TranscriptionResult


def _make_deepgram_response(transcript: str, confidence: float = 0.95):
    """Build a minimal object that mirrors the Deepgram SDK response structure."""
    word = MagicMock()
    word.word = "test"
    word.start = 0.0
    word.end = 1.0
    word.confidence = confidence

    alternative = MagicMock()
    alternative.transcript = transcript
    alternative.confidence = confidence
    alternative.words = [word] if transcript else []

    channel = MagicMock()
    channel.alternatives = [alternative]

    response = MagicMock()
    response.results.channels = [channel]
    return response


class TestDeepgramServiceParsing:
    """Tests for _parse_response — the response normalisation logic."""

    def test_parses_transcript_correctly(self):
        service = DeepgramService()
        response = _make_deepgram_response("Patient has a fever")
        result = service._parse_response(response)

        assert isinstance(result, TranscriptionResult)
        assert result.transcript == "Patient has a fever"
        assert result.confidence == 0.95

    def test_returns_empty_result_on_malformed_response(self):
        """If the response structure is unexpected, return an empty result (don't crash)."""
        service = DeepgramService()
        bad_response = MagicMock()
        bad_response.results.channels = []  # no channels → IndexError

        result = service._parse_response(bad_response)
        assert result.transcript == ""
        assert result.confidence == 0.0

    def test_is_empty_property_true_for_blank_transcript(self):
        result = TranscriptionResult(transcript="   ", confidence=0.0)
        assert result.is_empty is True

    def test_is_empty_property_false_for_real_transcript(self):
        result = TranscriptionResult(transcript="fever and cough", confidence=0.9)
        assert result.is_empty is False


class TestDeepgramServiceTranscribeAudio:
    """Integration-style tests for the public transcribe_audio method."""

    async def test_successful_transcription(self, mocker):
        """Happy path: SDK returns a valid response → we get a TranscriptionResult."""
        service = DeepgramService()
        mock_response = _make_deepgram_response("Patient reports headache")

        # Set _client directly to bypass the @property lazy-init (can't patch @property)
        mock_sdk_client = MagicMock()
        mock_sdk_client.listen.v1.media.transcribe_file = AsyncMock(
            return_value=mock_response
        )
        service._client = mock_sdk_client

        result = await service.transcribe_audio(b"audio bytes", consultation_id="test-123")

        assert result.transcript == "Patient reports headache"
        assert not result.is_empty

    async def test_api_exception_returns_empty_result(self, mocker):
        """
        If the Deepgram API raises (network error, auth failure, etc.)
        we must get an empty TranscriptionResult — NOT an unhandled exception.
        The caller (_run_transcription) will then mark the consultation FAILED.
        """
        service = DeepgramService()
        mock_sdk_client = MagicMock()
        mock_sdk_client.listen.v1.media.transcribe_file = AsyncMock(
            side_effect=Exception("Connection timeout")
        )
        service._client = mock_sdk_client

        result = await service.transcribe_audio(b"audio bytes", consultation_id="test-456")

        assert result.is_empty is True
        assert result.transcript == ""
        assert result.confidence == 0.0
