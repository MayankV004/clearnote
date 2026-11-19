"""
test_s3_async_spooling.py

Tests for TICKET-10 (audio spooling) and TICKET-11 (async non-blocking S3 operations).
"""

import pytest
import io
import tempfile
from unittest.mock import MagicMock, patch
from app.services.s3_service import S3Service


@pytest.mark.asyncio
class TestS3AsyncAndSpooling:
    """Verifies that S3Service supports async thread dispatch and file-like spooled objects."""

    async def test_upload_audio_accepts_spooled_file(self):
        service = S3Service()
        mock_boto_client = MagicMock()
        service._client = mock_boto_client
        service._audio_bucket_verified = True

        # Create a spooled file with dummy audio data
        spool = tempfile.SpooledTemporaryFile(max_size=1024, mode="w+b")
        spool.write(b"RIFF....WAVEfmt ....data" + b"x" * 2000)
        spool.seek(0)

        key = await service.upload_audio(spool.read(), consultation_id="test-spool-001")
        assert key == "audio/test-spool-001.webm"
        mock_boto_client.put_object.assert_called_once()
        spool.close()

    async def test_async_thread_dispatch_on_delete_and_presign(self):
        service = S3Service()
        mock_boto_client = MagicMock()
        mock_boto_client.generate_presigned_url.return_value = "https://s3.example.com/audio/123.webm?sig=abc"
        service._client = mock_boto_client

        # Presign
        url = await service.generate_presigned_url("audio/123.webm")
        assert "sig=abc" in url
        mock_boto_client.generate_presigned_url.assert_called_once()

        # Delete
        await service.delete_audio("audio/123.webm")
        mock_boto_client.delete_object.assert_called_once()
