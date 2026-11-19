# Changelog

All notable changes to the ClearNote platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### AI Safety & Quality
- **TICKET-06 (`AI-01`)**: Implemented human-in-the-loop review state machine. Consultation status now transitions to `AWAITING_REVIEW` upon background extraction completion. Added `POST /consultations/{id}/approve` clinical sign-off endpoint. Blocked prescription generation until explicit doctor approval is recorded, preventing unreviewed AI hallucinations from reaching patients. Added Alembic migration `c1a2b3d4e5f6` for `consultationstatus` enum.

### Security
- **TICKET-01E (`SEC-08`)**: Calibrated Content-Security-Policy (CSP) header in `SecurityHeadersMiddleware` to explicitly whitelist Clerk authentication domains, S3 presigned asset delivery, and Deepgram WebSocket endpoints. Applied SlowAPI rate limiting to public prescription endpoints (10/min), guideline PDF ingestion (5/min), and patient data deletion requests (10/min).
- **TICKET-01D (`SEC-07`)**: Implemented prompt injection defenses with structural XML tag delimiters (`<untrusted_clinical_dialogue>`, `<guideline_context>`, `<patient_context>`) in `soap_extraction.py` and `drug_interaction.py`. Added explicit system instructions to ignore meta-commands and treat dialogue strictly as untrusted clinical data.
- **TICKET-01C (`SEC-06`)**: Implemented HIPAA PHI sanitization in application logging (`mask_email`, `mask_phone`). Removed plaintext patient names, email addresses, and phone numbers from logs across `patient_service`, `notification_service`, and `webhooks`.
- **TICKET-01B (`SEC-03`)**: Implemented `set_rls_doctor_id` parameter hook in `get_current_doctor` (covering both cache hits and misses) and `get_current_doctor_ws`, executing parameterized `set_config('app.current_doctor_id', :doctor_id, true)` to enforce PostgreSQL Row-Level Security at the database layer.
- **TICKET-04 (`SEC-05`)**: Replaced naked UUID lookup on `GET /consultations/public/{id}/prescription` with HMAC-SHA256 signed access tokens with 7-day expiration, mitigating UUID enumeration attacks and securing public prescription sharing.
- **TICKET-03 (`SEC-04`)**: Enforced tenant isolation in `POST /data-deletion/`, `POST /data-deletion/{id}/process`, and `GET /data-deletion/`. Doctors can now only request, process, or view data deletion records for their own verified patients.
- **TICKET-02 (`SEC-02`)**: Populated `request.state.user_id` in `get_current_user` and `get_current_doctor` dependencies, ensuring `RequestLoggingMiddleware` correctly records all mutating API interactions into the `audit_logs` table for HIPAA compliance.
- **TICKET-01 (`SEC-01`)**: Authenticated consultation audio WebSocket stream (`/{consultation_id}/stream`) with Clerk JWT verification and consultation ownership validation. Unauthorized connections are terminated with code 1008.

### Initial
- Baseline architectural and planning documentation established.
