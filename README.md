# ClearNote
*AI-Powered Clinical Documentation & CRM Assistant*

## Overview
ClearNote is an intelligent clinical documentation platform designed to alleviate administrative overhead for healthcare professionals. By recording patient consultations, it automatically generates structured SOAP (Subjective, Objective, Assessment, Plan) notes and prescriptions. Utilizing a Retrieval-Augmented Generation (RAG) approach with clinical guidelines, ClearNote ensures medical documentation is accurate, contextual, and efficiently managed.

## Key Features
- **Patient Management:** Complete CRUD operations for patient records, including tracking age, height, weight, allergies, baseline medications, and HIPAA consent, with paginated rosters.
- **AI Consultation Pipeline:** Streams or uploads consultation audio via Deepgram (`nova-3-medical`) and generates structured SOAP notes, ICD-10 codes, and medication regimens via Groq (`llama-3.3-70b-versatile` with `llama-3.1-8b-instant` fallback).
- **Clinical Guidelines RAG:** Ingests clinical PDF guidelines (`pdfplumber` + `RecursiveCharacterTextSplitter`) and checks pairwise drug-drug interactions using local FastEmbed (`nomic-ai/nomic-embed-text-v1.5`, 768-dim) embeddings and PostgreSQL `pgvector` with an HNSW cosine index.
- **Human-in-the-Loop Clinical Review:** Enforces `AWAITING_REVIEW` -> `COMPLETE` clinician sign-off (`POST /consultations/{id}/approve`) before prescription generation.
- **Automated Prescriptions & Notifications:** Generates PDF prescriptions via WeasyPrint + Jinja2, stores them securely in AWS S3 with HMAC-SHA256 signed sharing tokens, and dispatches links via SendGrid/Twilio.
- **Doctor Profiles & Stats:** Manages doctor onboarding, credentials, digital signatures, and cached consultation statistics (Upstash Redis).
- **Secure Authentication & Compliance:** Clerk RS256 JWT auth (HTTP & WebSocket), PostgreSQL Row-Level Security (RLS), SlowAPI rate limiting, immutable audit logging, and GDPR/HIPAA cascade deletion.

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16.2.6, React 19, TypeScript 5, Tailwind CSS v4, `@base-ui/react`, TanStack Query v5, Motion, Sonner |
| **Backend** | FastAPI 0.136.3, Python 3.12+, SQLAlchemy 2.0 (Async), `asyncpg`, Alembic |
| **Database** | PostgreSQL (NeonDB) with `pgvector` (HNSW cosine index) |
| **AI / LLM & RAG** | Groq (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`), Deepgram (`nova-3-medical`), FastEmbed (`nomic-ai/nomic-embed-text-v1.5`), LangChain Text Splitters |
| **Storage & PDF** | AWS S3 (`boto3` via `asyncio.to_thread`), WeasyPrint, Jinja2, `pdfplumber` |
| **Auth & Security** | Clerk (JWKS / Svix webhooks), PostgreSQL RLS, SlowAPI, Upstash Redis |

## Architecture
ClearNote connects a Next.js clinical portal to an async FastAPI backend:
1. **Input & Audio Streaming:** The frontend streams encounter audio over an authenticated WebSocket (`/consultations/{id}/stream`, spooled via 5 MB `SpooledTemporaryFile`) or uploads clinical guideline PDFs (`/consultations/ingest-guidelines`).
2. **Transcription & Guideline Ingestion:** Deepgram `nova-3-medical` transcribes audio; `pdfplumber` + `RecursiveCharacterTextSplitter` (chunk size 800, overlap 150) + FastEmbed (`nomic-embed-text-v1.5`) store 768-dim vectors in PostgreSQL `pgvector`.
3. **LLM Extraction & RAG Safety Check:** Groq `llama-3.3-70b-versatile` extracts SOAP notes, diagnoses, and medications, then evaluates pairwise drug interactions against the top-3 HNSW-retrieved guideline chunks (capping confidence $\le 0.5$ when no local chunks match).
4. **Clinician Review & Fulfillment:** Consultations stop at `AWAITING_REVIEW` until approved (`POST /consultations/{id}/approve` -> `COMPLETE`), after which WeasyPrint renders a signed PDF prescription uploaded to AWS S3.

```text
[ Frontend (Next.js 16) ] <--> [ Backend (FastAPI) ]
                                    |       |
        +---------------------------+       +---------------------------+
        |                                                               |
[ Deepgram (nova-3-medical) ]                                     [ Groq (LLM) ]
                                                                        |
                                                   [ FastEmbed + pgvector (HNSW) ]
```

## Prerequisites
- **Node.js**: v20+ (TypeScript 5+)
- **Python**: v3.12+
- **uv**: Recommended Python package manager (or `pip`)
- **Database**: PostgreSQL with the `pgvector` extension (e.g., NeonDB)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd clearnote
```

### 2. Backend Setup
```bash
cd backend
uv sync                          # Creates .venv and installs dependencies from pyproject.toml / uv.lock
uv run alembic upgrade head      # Run database migrations
```
*(Alternatively, with standard `pip`: `python -m venv .venv && source .venv/bin/activate && pip install -e .`)*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Environment Variables
Create `.env` files in both the `backend/` and `frontend/` directories.

**Backend (`backend/.env`)**
| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async PostgreSQL connection string (`postgresql+asyncpg://...`) | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk Auth publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk Auth secret key | Yes |
| `CLERK_AUTHORIZED_PARTIES` | Allowed CORS/JWT origins for Clerk (JSON list) | No (default `["http://localhost:3000"]`) |
| `CLERK_WEBHOOK_SECRET` | Secret to verify Clerk Svix webhooks | Yes |
| `FRONTEND_URL` | URL of the frontend application | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key for transcription | Yes |
| `GROQ_API_KEY` | Groq API key for LLM inference | Yes |
| `GROQ_MODEL` / `GROQ_FALLBACK_MODEL` | Primary & fallback Groq models | No (defaults: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key (or MinIO user) | Yes (for S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key (or MinIO password) | Yes (for S3) |
| `AWS_REGION` | AWS Region for S3 | No (default `us-east-1`) |
| `AWS_ENDPOINT_URL` | Custom S3 endpoint (e.g. `http://localhost:9000` for MinIO) | No |
| `AUDIO_BUCKET_NAME` | AWS S3 bucket name for consultation audio | No (default `clearnote-audio`) |
| `PDF_BUCKET_NAME` | AWS S3 bucket name for prescription PDFs & signatures | No (default `clearnote-pdfs`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | No |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST auth token | No |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | SendGrid email delivery credentials | No |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Twilio SMS reminder credentials | No |

**Frontend (`frontend/.env`)**
| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Custom sign-in route | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Custom sign-up route | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Post sign-in redirect | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Post sign-up redirect | Yes |
| `NEXT_PUBLIC_API_URL` | Backend URL for Client components | Yes |
| `API_URL` | Backend URL for Server components | Yes |

## Running Locally

**Start Backend**
```bash
cd backend
uv run uvicorn app.main:app --reload
# API runs at http://localhost:8000
```

**Start Frontend**
```bash
cd frontend
npm run dev
# App runs at http://localhost:3000
```

## Testing

**Backend (`pytest` & Retrieval Eval)**
```bash
cd backend
uv run pytest
uv run python -m tests.evals.test_rag_retrieval_evals
```
- Latest `pytest` run: **117 passed, 2 warnings in 7.40s** (unit, integration, security, reliability, mocked SOAP extraction evals, and real FastEmbed RAG retrieval evals against in-memory SQLite).
- **RAG Retrieval Benchmark** (`tests/evals/rag_golden_dataset.py`, `tests/evals/test_rag_retrieval_evals.py`, 12 manually labelled clinical queries over 18 guideline chunks): **Precision@3 = `0.3333`** (ceiling `1/3`), **Recall@3 = `1.0000`**, **MRR = `1.0000`**.
- **SOAP Extraction Eval** (`tests/evals/test_clinical_evals.py`): Measures medication, ICD-10 prefix, and allergy precision/recall/F1 using mocked Groq completions.

**Frontend (Type Check, Lint & Playwright E2E)**
```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run test:e2e
```

## Project Structure
```text
clearnote/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database & pgvector/HNSW migrations
│   ├── app/
│   │   ├── api/              # Auth/DB dependencies & route controllers
│   │   ├── core/             # Config, security tokens, rate limiter, PHI-safe logger
│   │   ├── middleware/       # Security headers & audit logging middleware
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── prompts/          # Versioned XML-delimited LLM prompt templates
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── services/         # Deepgram, Groq LLM, FastEmbed RAG, S3, WeasyPrint PDF, Cache
│   └── tests/                # Unit, integration, and eval suites (117 tests)
├── frontend/                 # Next.js 16 Application
│   ├── src/
│   │   ├── app/              # App Router pages, layouts, globals.css
│   │   ├── components/       # AppShell, clinical trust UI, motion & Base UI primitives
│   │   └── features/         # Domain hooks & components (consultations, patients, doctor)
│   └── tests/e2e/            # Playwright end-to-end tests
└── docs/                     # Architecture, PRD, API reference, and engineering reports
```

## API Overview
*Main endpoints provided by the FastAPI backend:*

- **Health (`/health`, `/db-test`)**
  - `GET /health` - Deep health probe verifying database connectivity.
- **Consultations (`/consultations`)**
  - `POST /ingest-guidelines` - Ingests clinical PDF guidelines for RAG (`5/minute` rate limit).
  - `POST /` - Creates a new consultation record (`PENDING`).
  - `GET /`, `GET /{id}` - Retrieves paginated consultation(s).
  - `WS /{id}/stream` - Authenticated live audio WebSocket stream (`SpooledTemporaryFile` + background pipeline).
  - `PATCH /{id}` - Updates consultation SOAP note, medications, or diagnoses and re-runs RAG checks.
  - `POST /{id}/approve` - Clinician sign-off gate transitioning `AWAITING_REVIEW` -> `COMPLETE`.
  - `POST /{id}/prescription` - Generates a signed PDF prescription (requires `COMPLETE` status).
  - `GET /{id}/prescription`, `GET /{id}/audio` - Retrieves expiring S3 pre-signed URLs.
  - `GET /public/{id}/prescription?token=...` - Token-verified public prescription redirect (`10/minute` rate limit).
- **Patients (`/patients`)**
  - `GET /`, `GET /{id}` - Fetches paginated patient list or single patient record.
  - `POST /`, `PATCH /{id}` - Creates or updates a patient record.
- **Doctors (`/doctors`)**
  - `GET /me`, `PATCH /me` - Manages the authenticated doctor's profile.
  - `PATCH /onboarding` - Handles doctor onboarding.
  - `POST /me/signature` - Uploads digital signature image to S3.
  - `GET /me/stats` - Retrieves cached doctor consultation statistics.
- **Data Deletion (`/data-deletion`)**
  - `POST /`, `GET /`, `POST /{request_id}/process` - GDPR/HIPAA right-to-erasure requests with S3 cascade purge.
- **Webhooks (`/webhooks`)**
  - `POST /clerk` - Syncs users from Clerk (Svix-verified) to PostgreSQL.
  - `POST /twilio`, `POST /sendgrid` - External delivery status webhooks.

## License
[TODO: confirm license]
