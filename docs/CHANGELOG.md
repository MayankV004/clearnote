# Changelog

All notable changes to the ClearNote platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Security
- **TICKET-01B (`SEC-03`)**: Implemented `set_rls_doctor_id` parameter hook in `get_current_doctor` (covering both cache hits and misses) and `get_current_doctor_ws`, executing parameterized `set_config('app.current_doctor_id', :doctor_id, true)` to enforce PostgreSQL Row-Level Security at the database layer.
- **TICKET-04 (`SEC-05`)**: Replaced naked UUID lookup on `GET /consultations/public/{id}/prescription` with HMAC-SHA256 signed access tokens with 7-day expiration, mitigating UUID enumeration attacks and securing public prescription sharing.
- **TICKET-03 (`SEC-04`)**: Enforced tenant isolation in `POST /data-deletion/`, `POST /data-deletion/{id}/process`, and `GET /data-deletion/`. Doctors can now only request, process, or view data deletion records for their own verified patients.
- **TICKET-02 (`SEC-02`)**: Populated `request.state.user_id` in `get_current_user` and `get_current_doctor` dependencies, ensuring `RequestLoggingMiddleware` correctly records all mutating API interactions into the `audit_logs` table for HIPAA compliance.
- **TICKET-01 (`SEC-01`)**: Authenticated consultation audio WebSocket stream (`/{consultation_id}/stream`) with Clerk JWT verification and consultation ownership validation. Unauthorized connections are terminated with code 1008.

### Initial
- Baseline architectural and planning documentation established.
