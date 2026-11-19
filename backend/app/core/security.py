import base64
import hashlib
import hmac
import json
import time
from uuid import UUID
from app.core.config import settings

def create_prescription_token(consultation_id: UUID | str, expires_in_days: int = 7) -> str:
    """
    Generate an HMAC-SHA256 signed URL token for public prescription access.
    Valid for `expires_in_days` days (default 7).
    """
    payload = {
        "cid": str(consultation_id),
        "exp": int(time.time()) + (expires_in_days * 86400),
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(
        settings.CLERK_SECRET_KEY.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_prescription_token(consultation_id: UUID | str, token: str) -> bool:
    """
    Verify that `token` is an authentic, non-expired signature matching `consultation_id`.
    """
    if not token:
        return False
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False
        payload_b64, signature = parts
        expected_sig = hmac.new(
            settings.CLERK_SECRET_KEY.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            return False

        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode())
        payload = json.loads(payload_bytes.decode())

        if payload.get("cid") != str(consultation_id):
            return False

        if payload.get("exp", 0) < int(time.time()):
            return False

        return True
    except Exception:
        return False
