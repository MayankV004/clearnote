"""
tests/unit/test_security_headers.py
───────────────────────────────────
Unit and integration tests for SecurityHeadersMiddleware and Route Rate Limiting (SEC-08).
"""
import pytest
from starlette.testclient import TestClient
from app.main import app

def test_security_headers_present():
    client = TestClient(app)
    response = client.get("/public")
    assert response.status_code == 200
    headers = response.headers
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert "strict-transport-security" in headers

def test_content_security_policy_whitelists_required_origins():
    client = TestClient(app)
    response = client.get("/public")
    csp = response.headers.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "clerk.accounts.dev" in csp
    assert "api.deepgram.com" in csp
    assert "amazonaws.com" in csp

def test_rate_limiting_on_public_prescription():
    client = TestClient(app)
    import uuid
    dummy_id = uuid.uuid4()
    # Hit the public endpoint multiple times to verify rate limiter decorator is attached
    response = None
    for _ in range(12):
        response = client.get(f"/consultations/public/{dummy_id}/prescription?token=invalid")
    # Rate limit for public prescription is 10/minute, so 11th/12th request should return 429
    assert response.status_code == 429


