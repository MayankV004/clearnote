"""
deepgram_service.py

A clean, standalone service for Deepgram speech-to-text transcription.
Modelled after the LiveSTT reference pattern — the client is lazily initialized,
all Deepgram API concerns live here, and the rest of the app only depends on the
simple public interface.

Currently implements prerecorded (file-based) transcription, the mode used
by the ClearNote consultation pipeline. The class is structured so that a live
WebSocket transcription mode can be added alongside it in the future.
"""

from dataclasses import dataclass, field
from typing import List

from deepgram import AsyncDeepgramClient

from app.core.config import settings
from app.core.logger import logger


# ── Result dataclass ────────────────────────────────────────────────────────

@dataclass
class TranscriptWord:
    word: str
    start: float
    end: float
    confidence: float
    speaker: int | None = None


@dataclass
class TranscriptionResult:
    """
    Normalised result returned by DeepgramService.
    Downstream services only depend on this type, not on deepgram SDK types.
    """
    transcript: str
    confidence: float
    words: List[TranscriptWord] = field(default_factory=list)
    duration_seconds: float = 0.0

    @property
    def is_empty(self) -> bool:
        return not self.transcript.strip()


# ── Service ─────────────────────────────────────────────────────────────────

class DeepgramService:
    """
    Wrapper around the Deepgram SDK.

    Usage (singleton at module bottom):
        from app.services.deepgram_service import deepgram_service
        result = await deepgram_service.transcribe_audio(audio_bytes)
    """

    # Model to use – nova-2-medical gives the best accuracy for clinical content
    MODEL = "nova-3"

    def __init__(self) -> None:
        # Client is created lazily so that unit tests can be written without a
        # real API key present in the environment.
        self._client: AsyncDeepgramClient | None = None

    # ── Private helpers ──────────────────────────────────────────────────────

    @property
    def client(self) -> AsyncDeepgramClient:
        if self._client is None:
            self._client = AsyncDeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
        return self._client

    def _parse_response(self, response) -> TranscriptionResult:
        """
        Pull the best alternative out of the raw Deepgram response and convert
        it to a TranscriptionResult. Mirrors the result-extraction pattern in
        the reference DeepgramSTT implementation.
        """
        try:
            channel = response.results.channels[0]
            best = channel.alternatives[0]

            words = [
                TranscriptWord(
                    word=w.word,
                    start=w.start,
                    end=w.end,
                    confidence=w.confidence,
                    speaker=getattr(w, "speaker", None),
                )
                for w in (best.words or [])
            ]

            duration = 0.0
            if words:
                duration = words[-1].end - words[0].start

            return TranscriptionResult(
                transcript=best.transcript,
                confidence=best.confidence,
                words=words,
                duration_seconds=duration,
            )

        except (AttributeError, IndexError) as exc:
            logger.error(f"DeepgramService: failed to parse API response – {exc}")
            return TranscriptionResult(transcript="", confidence=0.0)

    # ── Public API ───────────────────────────────────────────────────────────

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        *,
        consultation_id: str = "unknown",
    ) -> TranscriptionResult:
        """
        Send raw audio bytes to Deepgram for prerecorded (file-based)
        transcription and return a normalised TranscriptionResult.

        Args:
            audio_bytes:      Raw audio content (webm, mp3, wav, etc.)
            consultation_id:  Used only for structured logging.

        Returns:
            TranscriptionResult – transcript is an empty string on failure.
        """
        logger.info(
            f"DeepgramService: submitting {len(audio_bytes):,} bytes "
            f"for consultation {consultation_id}"
        )

        try:
            response = await self.client.listen.v1.media.transcribe_file(
                request=audio_bytes,
                model=self.MODEL,
                smart_format=True,
                diarize=True,
                punctuate=True,
            )

            result = self._parse_response(response)

            if result.is_empty:
                logger.warning(
                    f"DeepgramService: empty transcript returned for "
                    f"consultation {consultation_id}. "
                    f"Check audio quality / duration."
                )
            else:
                logger.info(
                    f"DeepgramService: transcription complete for {consultation_id} "
                    f"– {len(result.transcript)} chars, "
                    f"confidence={result.confidence:.2f}, "
                    f"duration={result.duration_seconds:.1f}s"
                )

            return result

        except Exception as exc:
            logger.error(
                f"DeepgramService: API call failed for consultation "
                f"{consultation_id} – {exc}"
            )
            # Return an empty result so the caller can decide how to handle failure
            # (e.g. mark the consultation FAILED) rather than crashing here.
            return TranscriptionResult(transcript="", confidence=0.0)


# Singleton – import and use this everywhere
deepgram_service = DeepgramService()
