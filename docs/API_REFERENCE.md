# ClearNote API Reference Specification

This document provides the definitive reference for the ClearNote REST and WebSocket APIs (`backend/app/api/routes/`). All routes, parameter types, authentication dependencies, response schemas, and status codes are derived directly from the application source code.

---

## 1. Authentication & Security Headers

ClearNote uses Clerk JSON Web Tokens (RS256). All protected endpoints require an `Authorization` header formatted as:
```http
Authorization: Bearer <clerk_jwt_token>
```
On each request, `backend/app/api/dependencies/auth.py:27` validates the token against Clerk's JWKS.

### Global Security Headers Applied (`backend/app/middleware/security_header.py:8`)
Every response includes:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`

### Rate Limiting (`backend/app/main.py:27`)
- Enforced via `SlowAPIMiddleware` using client IP: `default_limits=["60/minute"]`.
- HTTP 429 response when exceeded:
```json
{"error": "Rate limit exceeded: 60 per 1 minute"}
```

---

## 2. Health & System Diagnostic Endpoints (`backend/app/main.py`)

### 2.1 System Health Check
- **Endpoint**: `GET /health`
- **Auth**: None (Public)
- **Description**: Deep diagnostic probe testing active database connectivity and application version status.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "database": "ok",
  "version": "1.0.0"
}
```
- **Response `200 OK` (Degraded Database)**:
```json
{
  "status": "degraded",
  "database": "unhealthy",
  "version": "1.0.0"
}
```

### 2.2 Database Connectivity Test
- **Endpoint**: `GET /db-test`
- **Auth**: None (Public)
- **Response `200 OK`**:
```json
{
  "ok": 1
}
```

---

## 3. Doctor Management Endpoints (`/doctors` - `backend/app/api/routes/doctors.py`)

### 3.1 Complete Doctor Onboarding
- **Endpoint**: `PATCH /doctors/onboarding`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`DoctorOnboarding` schema):
```json
{
  "specialty": "Internal Medicine",
  "license_number": "MED-948201",
  "phone_number": "+15551234567",
  "clinic_address": "Suite 400, Metro Health Pavilion, NY"
}
```
- **Response `200 OK`** (`DoctorResponse`):
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "clerk_id": "user_2test123",
  "email": "doctor@hospital.org",
  "name": "Dr. Sarah Jenkins",
  "specialty": "Internal Medicine",
  "license_number": "MED-948201",
  "phone_number": "+15551234567",
  "clinic_address": "Suite 400, Metro Health Pavilion, NY",
  "signature_url": null,
  "created_at": "2026-11-19T10:00:00Z",
  "updated_at": "2026-11-19T10:05:00Z"
}
```
- **Errors**:
  - `400 Bad Request`: `{"detail": "Doctor already onboarded"}`
  - `401 Unauthorized`: Missing or invalid Clerk JWT.
  - `404 Not Found`: `{"detail": "Doctor not found"}`

### 3.2 Get Current Doctor Profile
- **Endpoint**: `GET /doctors/me`
- **Auth**: Required (`get_current_doctor`)
- **Description**: Returns profile for authenticated doctor. If `signature_url` is stored, resolves it into a temporary pre-signed S3 download URL.
- **Response `200 OK`** (`DoctorResponse`):
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "clerk_id": "user_2test123",
  "email": "doctor@hospital.org",
  "name": "Dr. Sarah Jenkins",
  "specialty": "Internal Medicine",
  "license_number": "MED-948201",
  "phone_number": "+15551234567",
  "clinic_address": "Suite 400, Metro Health Pavilion, NY",
  "signature_url": "https://clearnote-pdfs-s3.s3.ap-south-1.amazonaws.com/signatures/9b1deb4d...?AWSAccessKeyId=...",
  "created_at": "2026-11-19T10:00:00Z",
  "updated_at": "2026-11-19T10:05:00Z"
}
```
- **Errors**:
  - `401 Unauthorized`: Invalid Bearer token.
  - `404 Not Found`: Doctor not found in database.

### 3.3 Upload Doctor Signature
- **Endpoint**: `POST /doctors/me/signature`
- **Auth**: Required (`get_current_doctor`)
- **Content-Type**: `multipart/form-data`
- **Form Parameters**:
  - `file`: Image binary (`image/png`, `image/jpeg`, etc.).
- **Response `200 OK`**:
```json
{
  "signature_url": "https://clearnote-pdfs-s3.s3.ap-south-1.amazonaws.com/signatures/9b1deb4d...?AWSAccessKeyId=..."
}
```
- **Errors**:
  - `400 Bad Request`: `{"detail": "Only image files are allowed."}` or `{"detail": "Empty file uploaded."}`

### 3.4 Update Doctor Profile
- **Endpoint**: `PATCH /doctors/me`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`DoctorUpdate` schema - all fields optional):
```json
{
  "name": "Dr. Sarah Jenkins, MD",
  "specialty": "Cardiology",
  "clinic_address": "Building B, Heart Institute"
}
```
- **Response `200 OK`** (`DoctorResponse`).
- **Errors**:
  - `404 Not Found`: `{"detail": "Doctor not found"}`

### 3.5 Get Doctor Analytics & Metrics
- **Endpoint**: `GET /doctors/me/stats`
- **Auth**: Required (`get_current_doctor`)
- **Caching**: Cached in Upstash Redis for 300 seconds (`TTL_STATS = 300`).
- **Response `200 OK`**:
```json
{
  "total_patients": 42,
  "new_patients_this_month": 8,
  "total_consultations": 65,
  "total_soap_notes": 59
}
```

---

## 4. Patient Endpoints (`/patients` - `backend/app/api/routes/patients.py`)

### 4.1 List Doctor's Patients
- **Endpoint**: `GET /patients/`
- **Auth**: Required (`get_current_doctor`)
- **Response `200 OK`** (`List[PatientResponse]`):
```json
[
  {
    "id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234",
    "doctor_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "John Doe",
    "date_of_birth": "1980-05-15",
    "gender": "Male",
    "phone_number": "+15559876543",
    "email": "johndoe@gmail.com",
    "medical_history": "Type 2 Diabetes, Hypertension",
    "allergies": ["Penicillin", "Sulfa drugs"],
    "current_medications": ["Metformin 500mg BID", "Lisinopril 10mg daily"],
    "consent_recorded": true,
    "consent_date": "2026-11-19T09:30:00Z",
    "created_at": "2026-11-19T09:30:00Z",
    "updated_at": "2026-11-19T09:30:00Z"
  }
]
```

### 4.2 Get Patient by ID
- **Endpoint**: `GET /patients/{patient_id}`
- **Auth**: Required (`get_current_doctor`)
- **Path Parameter**: `patient_id` (UUID)
- **Response `200 OK`** (`PatientResponse`).
- **Errors**:
  - `404 Not Found`: `{"detail": "Patient not found"}`

### 4.3 Create Patient
- **Endpoint**: `POST /patients/`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`PatientCreate` schema):
```json
{
  "name": "Jane Smith",
  "date_of_birth": "1992-08-24",
  "gender": "Female",
  "phone_number": "+15553334444",
  "email": "janesmith@gmail.com",
  "medical_history": "Mild Asthma",
  "allergies": ["Amoxicillin"],
  "current_medications": ["Albuterol inhaler PRN"],
  "consent_recorded": true
}
```
- **Response `201 Created`** (`PatientResponse`).
- **Errors**:
  - `422 Unprocessable Entity`: Validation failure on email or required fields.

### 4.4 Update Patient
- **Endpoint**: `PATCH /patients/{patient_id}`
- **Auth**: Required (`get_current_doctor`)
- **Path Parameter**: `patient_id` (UUID)
- **Request Body** (`PatientUpdate` schema - all optional).
- **Response `200 OK`** (`PatientResponse`).
- **Errors**:
  - `404 Not Found`: `{"detail": "Patient not found"}`

---

## 5. Consultation & Prescriptions (`/consultations` - `backend/app/api/routes/consultations.py`)

### 5.1 Create Consultation Draft
- **Endpoint**: `POST /consultations/`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`ConsultationCreate` schema):
```json
{
  "patient_id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234"
}
```
- **Response `201 Created`** (`ConsultationResponse`):
```json
{
  "id": "1b01c3c2-d352-4cf4-91bc-d18386f91cb1",
  "doctor_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "patient_id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234",
  "status": "PENDING",
  "audio_url": null,
  "transcript": null,
  "prescription_pdf_url": null,
  "created_at": "2026-11-19T10:15:00Z",
  "updated_at": "2026-11-19T10:15:00Z",
  "soap_note": null,
  "medications": [],
  "diagnoses": [],
  "interactions": []
}
```

### 5.2 List Patient Consultations
- **Endpoint**: `GET /consultations/`
- **Auth**: Required (`get_current_doctor`)
- **Query Parameter**: `patient_id` (UUID - required)
- **Response `200 OK`** (`List[ConsultationResponse]`).

### 5.3 Get Consultation Detail
- **Endpoint**: `GET /consultations/{consultation_id}`
- **Auth**: Required (`get_current_doctor`)
- **Response `200 OK`** (`ConsultationResponse`):
```json
{
  "id": "1b01c3c2-d352-4cf4-91bc-d18386f91cb1",
  "doctor_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "patient_id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234",
  "status": "COMPLETED",
  "audio_url": "audio/1b01c3c2-d352-4cf4-91bc-d18386f91cb1.webm",
  "transcript": "Doctor: Hello Mr. Doe... Patient: I have had a severe dry cough...",
  "prescription_pdf_url": "prescriptions/1b01c3c2-d352-4cf4-91bc-d18386f91cb1.pdf",
  "created_at": "2026-11-19T10:15:00Z",
  "updated_at": "2026-11-19T10:16:30Z",
  "soap_note": {
    "id": "5fa23bb0-1234-4567-8901-abcdef012345",
    "subjective": "Patient reports dry cough for 5 days with low grade fever.",
    "objective": "Lungs clear to auscultation bilaterally. Temp 99.1F, BP 124/82.",
    "assessment": "Acute upper respiratory tract infection.",
    "plan": "Hydration, rest, and symptomatic relief with Dextromethorphan."
  },
  "medications": [
    {
      "id": "2bc34d5e-6789-0123-4567-89abcdef0123",
      "name": "Dextromethorphan HBr",
      "dosage": "15mg",
      "frequency": "Every 4 hours PRN",
      "duration": "5 days",
      "instructions": "Do not exceed 6 doses in 24 hours"
    }
  ],
  "diagnoses": [
    {
      "id": "3cd45e6f-7890-1234-5678-9abcdef01234",
      "code": "J06.9",
      "description": "Acute upper respiratory infection, unspecified",
      "is_primary": true
    }
  ],
  "interactions": [
    {
      "id": "4de56f7a-8901-2345-6789-abcdef012345",
      "severity": "INFO",
      "description": "No significant interaction with current baseline Metformin.",
      "recommendation": "Monitor blood glucose as illness may cause transient elevation."
    }
  ]
}
```
- **Errors**:
  - `404 Not Found`: `{"detail": "Consultation 1b01c3c2-... not found."}`

### 5.4 Update Consultation Details
- **Endpoint**: `PATCH /consultations/{consultation_id}`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`ConsultationUpdate` schema):
```json
{
  "soap_note": {
    "subjective": "Updated subjective details...",
    "objective": "Updated vitals...",
    "assessment": "Updated assessment...",
    "plan": "Updated management plan..."
  },
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "TID",
      "duration": "7 days",
      "instructions": "Take with food"
    }
  ]
}
```
- **Response `200 OK`** (`ConsultationResponse`).

### 5.5 Live Audio WebSocket Streaming
- **Endpoint**: `WS /consultations/{consultation_id}/stream`
- **Auth**: Clerk JWT via `?token=<clerk_jwt>` query param or `Sec-WebSocket-Protocol` header. Verified doctor ownership (`Consultation.doctor_id == current_doctor.id`).
- **Protocol**:
  - Client connects: `ws://localhost:8000/consultations/{consultation_id}/stream?token=<jwt>`
  - Client sends: Raw binary audio bytes (`data: bytearray`)
  - Server streams chunks to Deepgram `nova-3-medical`.
  - On WebSocket close / disconnect: Server writes accumulated audio to S3, saves transcript, and launches background clinical extraction.
- **Connection Closure Reasons**:
  - `1008 Policy Violation`: Missing/invalid token or consultation unowned/not found in database.

### 5.6 Approve & Sign Off Consultation
- **Endpoint**: `POST /consultations/{consultation_id}/approve`
- **Auth**: Required (`get_current_doctor`)
- **Description**: Attending physician reviews and signs off on the consultation notes, diagnoses, and medications. Transitions status from `AWAITING_REVIEW` to `COMPLETED`. Required before prescription generation is unlocked.
- **Response `200 OK`** (`ConsultationResponse`):
```json
{
  "id": "1b01c3c2-d352-4cf4-91bc-d18386f91cb1",
  "status": "COMPLETED",
  "updated_at": "2026-11-19T10:16:30Z"
}
```
- **Errors**:
  - `400 Bad Request`: `{"detail": "Consultation must be in AWAITING_REVIEW status to approve (current: PENDING)"}`
  - `404 Not Found`: `{"detail": "Consultation not found"}`

### 5.7 Generate Prescription PDF
- **Endpoint**: `POST /consultations/{consultation_id}/prescription`
- **Auth**: Required (`get_current_doctor`)
- **Description**: Compiles prescription HTML using WeasyPrint, uploads to S3, returns pre-signed URL, and triggers async email to patient if email exists. Requires consultation status to be `COMPLETED`.
- **Response `200 OK`**:
```json
{
  "url": "https://clearnote-pdfs-s3.s3.ap-south-1.amazonaws.com/prescriptions/1b01c3c2-d352-4cf4-91bc-d18386f91cb1.pdf?AWSAccessKeyId=..."
}
```
- **Errors**:
  - `400 Bad Request`: `{"detail": "Consultation must be approved and completed by doctor before generating prescription (current status: AWAITING_REVIEW)."}`
  - `404 Not Found`: Consultation not found.

### 5.8 Get Existing Prescription URL
- **Endpoint**: `GET /consultations/{consultation_id}/prescription`
- **Auth**: Required (`get_current_doctor`)
- **Response `200 OK`**:
```json
{
  "url": "https://clearnote-pdfs-s3.s3.ap-south-1.amazonaws.com/prescriptions/1b01c3c2-d352-4cf4-91bc-d18386f91cb1.pdf?AWSAccessKeyId=..."
}
```
- **Errors**:
  - `404 Not Found`: `{"message": "Prescription not generated yet."}`

### 5.9 Public Prescription Access
- **Endpoint**: `GET /consultations/public/{consultation_id}/prescription`
- **Auth**: HMAC-SHA256 signed access token via `?token=<signed_token>` (7-day validity).
- **Rate Limit**: 10 requests / minute per IP.
- **Response**: `HTTP 307 Temporary Redirect` to AWS S3 pre-signed PDF URL.
- **Errors**:
  - `401 Unauthorized`: `{"message": "Invalid or expired prescription access token."}`
  - `404 Not Found`: `{"message": "Consultation not found."}` or `{"message": "Prescription not generated yet."}`
  - `429 Too Many Requests`: Exceeded 10 requests/minute limit.

### 5.10 Get Consultation Audio Recording URL
- **Endpoint**: `GET /consultations/{consultation_id}/audio`
- **Auth**: Required (`get_current_doctor`)
- **Description**: Retrieves a temporary presigned AWS S3 URL for streaming the consultation audio recording.
- **Response `200 OK`**:
```json
{
  "url": "https://clearnote-audio-s3.s3.ap-south-1.amazonaws.com/audio/1b01c3c2-d352-4cf4-91bc-d18386f91cb1.webm?AWSAccessKeyId=..."
}
```
- **Errors**:
  - `404 Not Found`: `{"message": "Audio recording not found."}` or `{"message": "Consultation not found."}`

### 5.11 Ingest Clinical Guidelines PDF (RAG Knowledge Base)
- **Endpoint**: `POST /consultations/ingest-guidelines`
- **Auth**: Required (`get_current_doctor`)
- **Content-Type**: `multipart/form-data`
- **Form Parameters**:
  - `source_name` (str): e.g. `"WHO Model List of Essential Medicines 2023"`
  - `file` (UploadFile): PDF binary document.
- **Response `200 OK`**:
```json
{
  "status": "success",
  "chunks_ingested": 142,
  "source": "WHO Model List of Essential Medicines 2023"
}
```
- **Errors**:
  - `400 Bad Request`: `{"message": "Only PDF files are accepted."}` or `{"message": "Uploaded file is empty."}`

---

## 6. Data Deletion Endpoints (`/data-deletion` - `backend/app/api/routes/data_deletion.py`)

### 6.1 Submit Right to Erasure Request
- **Endpoint**: `POST /data-deletion/`
- **Auth**: Required (`get_current_doctor`)
- **Request Body** (`DataDeletionRequestCreate` schema):
```json
{
  "patient_id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234"
}
```
- **Response `201 Created`** (`DataDeletionRequestResponse`):
```json
{
  "id": "7fa123bc-1122-3344-5566-778899aabbcc",
  "patient_id": "e4a2d8a0-9c2b-4568-a831-291d9f8c1234",
  "doctor_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "PENDING",
  "requested_at": "2026-11-19T10:45:00Z",
  "processed_at": null
}
```

### 6.2 Process Deletion Request
- **Endpoint**: `POST /data-deletion/{request_id}/process`
- **Auth**: Required (`get_current_doctor`)
- **Description**: Hard deletes the patient and child records (consultations, notes, S3 artifacts) and updates status to `PROCESSED`.
- **Response `200 OK`** (`DataDeletionRequestResponse`).
- **Errors**:
  - `404 Not Found`: `{"detail": "Pending deletion request not found"}`

### 6.3 List Deletion Requests
- **Endpoint**: `GET /data-deletion/`
- **Auth**: Required (`get_current_doctor`)
- **Response `200 OK`** (`List[DataDeletionRequestResponse]`).

---

## 7. Webhook Endpoints (`/webhooks` - `backend/app/api/routes/webhooks.py`)

### 7.1 Clerk User Webhook
- **Endpoint**: `POST /webhooks/clerk`
- **Auth**: Verified via Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`).
- **Handled Events**:
  - `user.created`: Automatically creates a `Doctor` record in Neon PostgreSQL with `clerk_id`, `email`, and `name`.
- **Response `200 OK`**: `{"status": "ok"}`
- **Errors**:
  - `400 Bad Request`: `{"detail": "Missing svix headers"}` or `{"detail": "Invalid webhook signature"}`

### 7.2 Twilio SMS Status Webhook
- **Endpoint**: `POST /webhooks/twilio`
- **Auth**: None
- **Content-Type**: `application/x-www-form-urlencoded`
- **Response `200 OK`**: `{"status": "ok"}`

### 7.3 SendGrid Email Delivery Webhook
- **Endpoint**: `POST /webhooks/sendgrid`
- **Auth**: None
- **Content-Type**: `application/json` (Array of delivery events)
- **Response `200 OK`**: `{"status": "ok"}`

---

## 8. Example & Debug Routes (`/examples` - `backend/app/api/routes/examples.py`)

- `GET /examples/public`: Unauthenticated test route returning `{"message": "Hello from ClearNote public endpoint!"}`.
- `GET /examples/protected`: Authenticated test route returning `{"message": "Hello authenticated user!", "user": state}`.
- `GET /examples/me`: Returns user claim dictionary parsed from Clerk JWT.
