# ClearNote
*AI-Powered Clinical Documentation & CRM Assistant*

## Overview
ClearNote is an intelligent clinical documentation platform designed to alleviate administrative overhead for healthcare professionals. By recording patient consultations, it automatically generates structured SOAP (Subjective, Objective, Assessment, Plan) notes and prescriptions. Utilizing a Retrieval-Augmented Generation (RAG) approach with clinical guidelines, ClearNote ensures medical documentation is accurate, contextual, and efficiently managed.

## Key Features
- **Patient Management:** Complete CRUD operations for patient records, including tracking age, height, weight, and consent.
- **AI Consultation Pipeline:** Transcribes audio to text (via Deepgram) and generates structured SOAP notes (via Groq LLMs).
- **Clinical Guidelines RAG:** Ingests clinical PDF guidelines to provide contextual AI assessments using pgvector embeddings.
- **Automated Prescriptions:** Generates final PDF prescriptions (via WeasyPrint) and stores them securely in AWS S3.
- **Doctor Profiles & Stats:** Manages doctor onboarding, settings, and consultation statistics.
- **Secure Authentication:** Identity and session management via Clerk with webhook synchronization.
- **Audit Logging:** Asynchronous middleware for immutable tracking of all data-mutating requests.

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16.2.6, React 19, Tailwind CSS v4, Shadcn, Sonner |
| **Backend** | FastAPI 0.136, Python 3.12+, SQLAlchemy 2.0 (Async) |
| **Database** | PostgreSQL (NeonDB) with `pgvector`, Alembic |
| **AI / LLM** | Groq, Deepgram, Langchain Text Splitters, Gemini API |
| **Storage & PDF** | AWS S3 (`boto3`), WeasyPrint, pdfplumber |
| **Auth & Security**| Clerk, SlowAPI, Upstash Redis |

## Architecture
ClearNote relies on an agentic/RAG architecture connecting a modern web frontend to a FastAPI backend:
1. **Input:** The frontend records audio or uploads clinical PDFs.
2. **Transcription & Ingestion:** Deepgram processes audio; Langchain + pdfplumber chunks PDFs, storing embeddings in PostgreSQL (`pgvector`).
3. **LLM Processing:** Groq retrieves relevant guideline embeddings and processes the transcription to form a structured SOAP note.
4. **Fulfillment:** WeasyPrint generates a PDF prescription, which is uploaded to AWS S3.
5. **Storage:** All metadata and patient records are saved asynchronously in Postgres.

```text
[ Frontend (Next.js) ] <--> [ Backend (FastAPI) ]
                                |       |
    +---------------------------+       +---------------------------+
    |                                                               |
[ Deepgram (Audio) ]                                          [ Groq (LLM) ]
                                                                    |
                                                      [ pgvector (Clinical Guidelines) ]
```

## Prerequisites
- **Node.js**: v20+ (Typescript 5+)
- **Python**: v3.12+
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
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt  # Or run `uv sync` if using uv
alembic upgrade head             # Run database migrations
```

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
| `DATABASE_URL` | Async PostgreSQL connection string | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk Auth publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk Auth secret key | Yes |
| `CLERK_AUTHORIZED_PARTIES` | Allowed CORS origins for Clerk | Yes |
| `CLERK_WEBHOOK_SECRET` | Secret to verify Clerk webhooks | Yes |
| `FRONTEND_URL` | URL of the frontend application | Yes |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | Yes |
| `AWS_REGION` | AWS Region for S3 | Yes |
| `AUDIO_BUCKET_NAME` | AWS S3 bucket name | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key for transcription | Yes |
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis connection URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

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
fastapi dev app/main.py
# API runs at http://localhost:8000
```

**Start Frontend**
```bash
cd frontend
npm run dev
# App runs at http://localhost:3000
```

## Project Structure
```text
clearnote/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database migration configuration
│   ├── app/                  
│   │   ├── api/routes/       # API endpoint controllers
│   │   ├── models/           # SQLAlchemy ORM models (AuditLog, Consultation, Patient, etc.)
│   │   └── services/         # Core business logic
│   └── wipe_db.py            # Utility to reset the database
└── frontend/                 # Next.js Application
    ├── src/
    │   ├── app/              # App router (pages, layouts, globals.css)
    │   ├── components/       # Shared UI components (Shadcn, Base UI)
    │   └── features/         # Domain-specific components (patients, doctors)
    ├── components.json       # Shadcn UI configuration
    └── package.json          # Frontend dependencies
```

## API Overview
*Main endpoints provided by the FastAPI backend:*

- **Consultations (`/consultations`)**
  - `POST /ingest-guidelines` - Ingests clinical PDF guidelines for RAG.
  - `POST /` - Creates a new consultation record.
  - `GET /`, `GET /{id}` - Retrieves consultation(s).
  - `PATCH /{id}` - Updates a consultation record.
  - `POST /{id}/prescription` - Generates a PDF prescription.
  - `GET /{id}/prescription` - Retrieves the PDF prescription link.
- **Patients (`/patients`)**
  - `GET /`, `GET /{id}` - Fetches patient data.
  - `POST /` - Creates a new patient record.
  - `PATCH /{id}` - Updates a patient record.
- **Doctors (`/doctors`)**
  - `GET /me`, `PATCH /me` - Manages the authenticated doctor's profile.
  - `PATCH /onboarding` - Handles doctor onboarding.
  - `GET /me/stats` - Retrieves doctor consultation statistics.
- **Webhooks (`/webhooks`)**
  - `POST /clerk` - Syncs users from Clerk to the local database.
  - `POST /twilio`, `POST /sendgrid` - External service webhooks.

## License
[TODO: confirm license]
