"""
s3_service.py

A clean, standalone service for all S3 / Minio storage operations.
boto3 is synchronous, so every method that touches the network is wrapped
in `run_in_threadpool` so the async event loop is never blocked.

Usage (singleton at module bottom):
    from app.services.s3_service import s3_service

    # Upload
    key = await s3_service.upload_audio(audio_bytes, consultation_id="abc-123")

    # Download
    audio_bytes = await s3_service.download_audio(key)

    # Delete  (e.g. after transcription is done to save space)
    await s3_service.delete_object(key)
"""

import tempfile
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.logger import logger


class S3Service:
    """
    Wraps all boto3 S3 calls in a clean async interface.
    The underlying boto3 client is created lazily and reused across calls
    (thread-safe for read operations; boto3 clients are not coroutine-safe
    but are thread-safe, which is fine since we dispatch through threadpool).
    """

    # Key prefix for all audio files stored by this app
    AUDIO_PREFIX = "audio"
    AUDIO_CONTENT_TYPE = "audio/webm"
    PDF_PREFIX = "prescriptions"
    PDF_CONTENT_TYPE = "application/pdf"

    def __init__(self) -> None:
        self._client = None
        self._audio_bucket_verified = False
        self._pdf_bucket_verified = False

    # ── Private helpers ──────────────────────────────────────────────────────

    @property
    def client(self):
        """Lazy-initialised boto3 S3 client."""
        if self._client is None:
            kwargs = dict(
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            if settings.AWS_ENDPOINT_URL:
                # Minio or LocalStack endpoint for local development
                kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
            self._client = boto3.client("s3", **kwargs)
            logger.info(
                f"S3Service: client initialised "
                f"(endpoint={settings.AWS_ENDPOINT_URL or 'AWS'}, "
                f"bucket={settings.AUDIO_BUCKET_NAME})"
            )
        return self._client

    def _audio_key(self, consultation_id: str) -> str:
        return f"{self.AUDIO_PREFIX}/{consultation_id}.webm"

    def _pdf_key(self, consultation_id: str) -> str:
        return f"{self.PDF_PREFIX}/{consultation_id}.pdf"

    async def _ensure_bucket_exists(self, bucket_name: str, verified_flag_attr: str) -> None:
        """Create the bucket if it doesn't already exist (idempotent)."""
        if getattr(self, verified_flag_attr):
            return

        def _check_and_create():
            try:
                self.client.head_bucket(Bucket=bucket_name)
            except ClientError:
                logger.info(
                    f"S3Service: bucket '{bucket_name}' not found — creating it."
                )
                if settings.AWS_REGION == "us-east-1" or settings.AWS_ENDPOINT_URL:
                    self.client.create_bucket(Bucket=bucket_name)
                else:
                    self.client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION},
                    )
                logger.info(f"S3Service: bucket '{bucket_name}' created.")

        try:
            await run_in_threadpool(_check_and_create)
            setattr(self, verified_flag_attr, True)
        except (BotoCoreError, ClientError) as exc:
            logger.error(f"S3Service: could not ensure bucket exists – {exc}")
            raise

    # ── Public API ───────────────────────────────────────────────────────────

    async def upload_audio(self, audio_bytes: bytes, consultation_id: str) -> str:
        """
        Upload raw audio bytes to the configured S3 bucket.

        Returns:
            The S3 key (e.g. "audio/<consultation_id>.webm") on success.

        Raises:
            Exception propagated from boto3 so the caller can decide how to
            handle storage failures (e.g. mark consultation FAILED).
        """
        key = self._audio_key(consultation_id)

        await self._ensure_bucket_exists(settings.AUDIO_BUCKET_NAME, "_audio_bucket_verified")

        logger.info(
            f"S3Service: uploading {len(audio_bytes):,} bytes → "
            f"s3://{settings.AUDIO_BUCKET_NAME}/{key}"
        )

        def _upload():
            self.client.put_object(
                Bucket=settings.AUDIO_BUCKET_NAME,
                Key=key,
                Body=audio_bytes,
                ContentType=self.AUDIO_CONTENT_TYPE,
            )

        try:
            await run_in_threadpool(_upload)
            logger.info(f"S3Service: upload complete – {key}")
            return key
        except (BotoCoreError, ClientError) as exc:
            logger.error(
                f"S3Service: upload failed for consultation {consultation_id} – {exc}"
            )
            raise

    async def upload_pdf(self, pdf_bytes: bytes, consultation_id: str) -> str:
        """
        Upload generated PDF bytes to the configured S3 bucket.

        Returns:
            The S3 key (e.g. "prescriptions/<consultation_id>.pdf") on success.
        """
        key = self._pdf_key(consultation_id)

        await self._ensure_bucket_exists(settings.PDF_BUCKET_NAME, "_pdf_bucket_verified")

        logger.info(
            f"S3Service: uploading {len(pdf_bytes):,} bytes → "
            f"s3://{settings.PDF_BUCKET_NAME}/{key}"
        )

        def _upload():
            self.client.put_object(
                Bucket=settings.PDF_BUCKET_NAME,
                Key=key,
                Body=pdf_bytes,
                ContentType=self.PDF_CONTENT_TYPE,
            )

        try:
            await run_in_threadpool(_upload)
            logger.info(f"S3Service: upload complete – {key}")
            return key
        except (BotoCoreError, ClientError) as exc:
            logger.error(
                f"S3Service: upload failed for consultation {consultation_id} – {exc}"
            )
            raise

    async def upload_signature(self, image_bytes: bytes, doctor_id: str, content_type: str) -> str:
        """
        Upload doctor signature image to the S3 bucket.
        Uses the PDF_BUCKET_NAME as it fits with prescriptions.
        Returns the S3 key.
        """
        extension = content_type.split("/")[-1] if "/" in content_type else "png"
        key = f"signatures/{doctor_id}.{extension}"

        await self._ensure_bucket_exists(settings.PDF_BUCKET_NAME, "_pdf_bucket_verified")

        logger.info(
            f"S3Service: uploading signature {len(image_bytes):,} bytes → "
            f"s3://{settings.PDF_BUCKET_NAME}/{key}"
        )

        def _upload():
            self.client.put_object(
                Bucket=settings.PDF_BUCKET_NAME,
                Key=key,
                Body=image_bytes,
                ContentType=content_type,
            )

        try:
            await run_in_threadpool(_upload)
            logger.info(f"S3Service: upload complete – {key}")
            return key
        except (BotoCoreError, ClientError) as exc:
            logger.error(
                f"S3Service: upload failed for signature {doctor_id} – {exc}"
            )
            raise

    async def download_audio(self, s3_key: str) -> bytes:
        """
        Download an audio file from S3 and return its raw bytes.

        Uses a temporary file on disk (same approach as before) because boto3's
        download_file streams efficiently to disk even for large files.
        """
        tmp_path = None
        try:
            # Create temp file path first, then close it so boto3 can write to it
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp_path = tmp.name

            logger.info(
                f"S3Service: downloading s3://{settings.AUDIO_BUCKET_NAME}/{s3_key}"
            )

            await run_in_threadpool(
                self.client.download_file,
                settings.AUDIO_BUCKET_NAME,
                s3_key,
                tmp_path,
            )

            with open(tmp_path, "rb") as f:
                data = f.read()

            logger.info(f"S3Service: download complete – {len(data):,} bytes")
            return data

        except (BotoCoreError, ClientError) as exc:
            logger.error(f"S3Service: download failed for key {s3_key} – {exc}")
            raise
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    async def delete_object(self, s3_key: str) -> None:
        """
        Delete a single object from S3. Silent no-op if the key doesn't exist.
        Useful for cleaning up audio files after transcription to save storage costs.
        """
        def _delete():
            self.client.delete_object(
                Bucket=settings.AUDIO_BUCKET_NAME,
                Key=s3_key,
            )

        try:
            await run_in_threadpool(_delete)
            logger.info(f"S3Service: deleted {s3_key}")
        except (BotoCoreError, ClientError) as exc:
            # Log but don't raise – a failed delete is not worth crashing the pipeline
            logger.warning(f"S3Service: could not delete {s3_key} – {exc}")

    async def generate_presigned_url(
        self, s3_key: str, expires_in: int = 3600, bucket_name: str = None
    ) -> str:
        """
        Generate a pre-signed GET URL so the frontend can download/playback
        audio or pdf directly from S3 without proxying through the backend.

        Args:
            s3_key:     The S3 object key.
            expires_in: URL lifetime in seconds (default 1 hour).
            bucket_name: Optional bucket name to override default audio bucket.

        Returns:
            A pre-signed HTTPS URL string.
        """
        target_bucket = bucket_name or settings.AUDIO_BUCKET_NAME
        def _presign():
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": target_bucket, "Key": s3_key},
                ExpiresIn=expires_in,
            )

        try:
            url = await run_in_threadpool(_presign)
            logger.info(f"S3Service: generated presigned URL for {s3_key}")
            return url
        except (BotoCoreError, ClientError) as exc:
            logger.error(f"S3Service: presigned URL generation failed – {exc}")
            raise


# Singleton – import and use this everywhere
s3_service = S3Service()
