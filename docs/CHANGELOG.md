# Changelog

All notable changes to the ClearNote platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Security
- **TICKET-01 (`SEC-01`)**: Authenticated consultation audio WebSocket stream (`/{consultation_id}/stream`) with Clerk JWT verification and consultation ownership validation. Unauthorized connections are terminated with code 1008.

### Initial
- Baseline architectural and planning documentation established.
