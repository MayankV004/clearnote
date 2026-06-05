# ClearNote

## AI-Powered Clinical Documentation Assistant

**Enhanced Project Design Document — v3.0**

**Auth: Clerk · Database: NeonDB + pgvector · HIPAA-aligned**

_Architecture · Clerk Auth · NeonDB · HIPAA/Privacy · Security · Error Handling · Testing · Deployment_

# 1. Project Overview

ClearNote is a full-stack clinical documentation assistant that converts doctor-patient voice consultations into structured, compliant medical records. v3.0 replaces Supabase Auth with Clerk for enterprise-grade authentication, and migrates the database from Supabase PostgreSQL to NeonDB — a serverless Postgres platform with native pgvector support, branching, and a generous free tier.

## 1.1 What It Does

- Doctor signs in via Clerk (email/password + MFA, or Google/GitHub OAuth).

- Audio is captured in the browser via the MediaRecorder API and streamed to FastAPI over WSS.

- After recording stops, audio is uploaded to S3 and processed by OpenAI Whisper via AWS Lambda.

- The full transcript is sent to Groq (Llama 3 70B) which extracts a structured SOAP note plus a JSON object of medications, dosages, diagnoses, and allergies.

- The RAG layer queries pgvector on NeonDB for WHO/ICMR guideline chunks and flags drug interactions with cited evidence.

- The doctor reviews, edits, and signs the note. A PDF prescription is generated and stored on S3.

- The patient receives the PDF by email (SendGrid) and per-medication SMS reminders via Twilio.

## 1.2 Key Architecture Changes vs v2.0

| **Component**         | **Change**                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Authentication        | Supabase Auth → Clerk (better MFA, social OAuth, session management, webhooks, and a purpose-built React SDK)                       |
| Database              | Supabase PostgreSQL → NeonDB serverless Postgres (branching, autoscaling, pgvector built-in, better free tier, no platform lock-in) |
| Row-level security    | Supabase RLS → NeonDB RLS policies (same SQL syntax, works identically)                                                             |
| Auth SDK (frontend)   | Supabase client → @clerk/nextjs (ClerkProvider, useAuth, useUser, SignIn/SignUp components)                                         |
| Auth JWT verification | Supabase JWT → Clerk JWT template (RS256, verified in FastAPI with JWKS endpoint)                                                   |

## 1.3 Resume-Worthy Summary

_"**Built a real-time clinical documentation assistant using a speech-to-text + LLM pipeline (Whisper → Groq), with retrieval-augmented drug-interaction checking over WHO/ICMR guidelines stored in pgvector on NeonDB serverless Postgres, Clerk for enterprise-grade multi-factor authentication, async transcription jobs on AWS Lambda triggered by S3 events, HIPAA-aligned data handling practices, WebSocket streaming for live transcript display, and a full-stack Next.js + FastAPI architecture deployed via Terraform and GitHub Actions CI/CD.**"_

# 2. Tech Stack

| **Layer**           | **Tool / Service**                 | **Cost**                               |
| ------------------- | ---------------------------------- | -------------------------------------- |
| Frontend            | Next.js 16 + TypeScript            | Free (Vercel)                          |
| Backend             | FastAPI (Python 3.12)              | Free (Railway/Render)                  |
| Authentication      | Clerk                              | Free tier (10K MAUs)                   |
| Database            | NeonDB serverless Postgres         | Free tier (0.5 GB, 100 hrs compute/mo) |
| Vector DB           | pgvector extension on NeonDB       | Free (included in NeonDB)              |
| DB branching        | NeonDB branches (dev/staging/prod) | Free (up to 10 branches)               |
| Transcription       | OpenAI Whisper API                 | ~$0.006 / min                          |
| Embeddings          | text-embedding-3-small             | ~$0.02 / 1M tokens                     |
| LLM                 | Groq (Llama 3 70B)                 | Free tier (generous)                   |
| Audio + PDF storage | AWS S3                             | Free tier 5 GB                         |
| Async jobs          | AWS Lambda                         | Free tier 1 M calls / mo               |
| Notifications (SMS) | Twilio                             | Trial credits                          |
| Email               | SendGrid                           | Free 100 emails / day                  |
| Session cache       | Upstash Redis                      | Free tier                              |
| Secrets             | AWS Secrets Manager                | Free (< 10 secrets)                    |
| IaC                 | Terraform                          | Free                                   |
| CI / CD             | GitHub Actions                     | Free                                   |
| Monitoring          | Sentry (errors) + Axiom (logs)     | Free tiers                             |

# 3. Authentication — Clerk

Clerk replaces Supabase Auth and provides a significantly more robust auth layer: pre-built React components, social OAuth, enterprise SSO, MFA enforcement, session management, webhook events, and a JWKS endpoint that FastAPI can verify without any custom JWT logic.

## 3.1 Why Clerk over Supabase Auth

| **Feature**             | **Clerk vs Supabase Auth**                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-built UI components | Clerk provides <SignIn />, <SignUp />, <UserButton />, <UserProfile /> React components. Supabase Auth requires you to build your own forms. |
| Social OAuth            | Clerk supports 20+ providers (Google, GitHub, Microsoft, Apple) with one config toggle. Supabase supports fewer and requires more setup.     |
| MFA enforcement         | Clerk lets you enforce TOTP/SMS MFA at the org level with zero custom code. Supabase MFA requires custom implementation.                     |
| Session management      | Clerk handles session expiry, token rotation, and multi-device sessions automatically. Supabase requires manual refresh token handling.      |
| Webhooks                | Clerk fires webhooks on user.created, session.created, user.deleted etc. — useful for provisioning doctor records in NeonDB on first login.  |
| JWT templates           | Clerk generates JWTs with custom claims (e.g. doctor_id, role) via configurable JWT templates. Easily verified in FastAPI.                   |
| Organisation support    | Clerk has built-in Organisations for future multi-clinic support. Supabase has no equivalent.                                                |
| Free tier               | 10,000 MAUs free. More than enough for a demo or small clinic.                                                                               |

## 3.2 Frontend Integration (@clerk/nextjs)

### 3.2.1 Setup

```
# Install the Clerk Next.js SDK npm install @clerk/nextjs
---
```

```
// app/layout.tsx — wrap the entire app in ClerkProvider import { ClerkProvider } from '@clerk/nextjs'; export default function RootLayout({ children }) {   return (     <ClerkProvider>       <html><body>{children}</body></html>     </ClerkProvider>   ); }
---
```

### 3.2.2 Protecting Routes (Middleware)

```
// middleware.ts — protect all /dashboard/* routes automatically import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'; const isProtected = createRouteMatcher(['/dashboard(.*)']); export default clerkMiddleware((auth, req) => {   if (isProtected(req)) auth().protect(); }); export const config = { matcher: ['/((?!_next│.*\..*).*)'] };
---
```

### 3.2.3 Getting the Auth Token for API Calls

```
// In any client component — get a JWT to send to FastAPI import { useAuth } from '@clerk/nextjs'; const { getToken } = useAuth(); const token = await getToken({ template: 'clearnote-backend' }); // 'clearnote-backend' is the JWT template name configured in Clerk dashboard // It adds custom claims: { doctor_id, role } const res = await fetch('/api/consultations', {   headers: { Authorization: `Bearer ${token}` } });
---
```

## 3.3 Backend JWT Verification (FastAPI)

FastAPI verifies Clerk JWTs using Clerk’s public JWKS endpoint. No shared secrets needed — it’s fully asymmetric RS256.

```
# pip install python-jose[cryptography] httpx import httpx, json from jose import jwt, JWTError from fastapi import Depends, HTTPException, status from fastapi.security import HTTPBearer CLERK_JWKS_URL = 'https://clerk.your-domain.com/.well-known/jwks.json' bearer = HTTPBearer() async def get_jwks():     async with httpx.AsyncClient() as c:         r = await c.get(CLERK_JWKS_URL)         return r.json()['keys'] async def get_current_doctor(token=Depends(bearer)) -> dict:     try:         keys = await get_jwks()   # cache this in production (Redis, 1hr TTL)         payload = jwt.decode(token.credentials, keys, algorithms=['RS256'],                             options={'verify_aud': False})         doctor_id = payload.get('doctor_id')  # custom claim from JWT template         if not doctor_id:             raise HTTPException(status_code=401, detail='Invalid token claims')         return payload     except JWTError:         raise HTTPException(status_code=401, detail='Invalid or expired token') # Usage on any protected endpoint: @app.get('/api/patients') async def list_patients(doctor=Depends(get_current_doctor)):     doctor_id = doctor['doctor_id']     # NeonDB query scoped to this doctor_id ...
---
```

## 3.4 Clerk JWT Template Configuration

In the Clerk dashboard, create a JWT template named 'clearnote-backend' with the following custom claims:

```
{   "doctor_id": "{{user.id}}",   "email":     "{{user.primary_email_address}}",   "role":      "{{user.public_metadata.role}}" }
---
```

Set the token lifetime to 3600 seconds (1 hour). The doctor_id maps directly to the doctors.clerk_user_id column in NeonDB.

## 3.5 Clerk Webhooks — Auto-provisioning Doctor Records

When a new doctor signs up via Clerk, a webhook fires to FastAPI which creates the doctor row in NeonDB:

```
# Clerk sends a POST to /webhooks/clerk on user.created from svix import Webhook  # pip install svix @app.post('/webhooks/clerk') async def clerk_webhook(request: Request):     wh = Webhook(CLERK_WEBHOOK_SECRET)  # from AWS Secrets Manager     payload = await request.body()     headers = dict(request.headers)     event = wh.verify(payload, headers)  # validates Svix signature     if event['type'] == 'user.created':         data = event['data']         await db.execute(             'INSERT INTO doctors (clerk_user_id, email, name) VALUES ($1, $2, $3)'             'ON CONFLICT (clerk_user_id) DO NOTHING',             data['id'], data['email_addresses'][0]['email_address'],             f"{data['first_name']} {data['last_name']}"         )     return {'status': 'ok'}
---
```

## 3.6 MFA Enforcement

- In the Clerk dashboard → Authentication → Multi-factor: set TOTP to Required for all users.

- Clerk handles the MFA UI and enforcement entirely. Zero custom code needed in FastAPI or Next.js.

- For future clinic/organisation-level enforcement: use Clerk Organisations and set MFA required at the org level.

## 3.7 Auth Flow Diagram

| **Step**                  | **What Happens**                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. Doctor visits /sign-in | Clerk's <SignIn /> component renders. No custom form code needed.                                     |
| 2. Clerk authenticates    | Doctor enters email + password + TOTP code. Clerk validates and creates a session.                    |
| 3. Session cookie set     | Clerk sets a secure, HttpOnly session cookie in the browser.                                          |
| 4. Client fetches API     | useAuth().getToken({ template: 'clearnote-backend' }) returns a short-lived JWT with doctor_id claim. |
| 5. FastAPI verifies JWT   | Fetches Clerk JWKS, verifies RS256 signature, extracts doctor_id.                                     |
| 6. NeonDB query scoped    | All queries are filtered by the verified doctor_id. NeonDB RLS provides a second enforcement layer.   |
| 7. Token expiry           | After 1 hour, Clerk auto-refreshes the token via the session cookie. FastAPI sees a fresh JWT.        |

# 4. Database — NeonDB Serverless Postgres

NeonDB is a serverless PostgreSQL platform with automatic scaling, database branching (like Git branches for your DB), and built-in pgvector support. It replaces Supabase PostgreSQL with a better developer experience and a more flexible free tier.

## 4.1 Why NeonDB over Supabase PostgreSQL

| **Feature**         | **NeonDB vs Supabase PostgreSQL**                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serverless scaling  | NeonDB auto-scales compute to zero when idle (saves cost). Supabase free tier pauses after 1 week of inactivity and takes 30+ seconds to cold start. |
| Database branching  | NeonDB branches create instant copy-on-write DB snapshots for dev/test. Supabase has no equivalent.                                                  |
| pgvector            | Built-in pgvector extension enabled with one toggle. Same on Supabase, but NeonDB’s vector indexing performance is superior.                         |
| Connection pooling  | Built-in PgBouncer-compatible pooling via the Neon serverless driver. No separate setup needed.                                                      |
| Free tier           | 0.5 GB storage + 100 compute hours/month. Supabase free tier pauses the project.                                                                     |
| No platform lock-in | NeonDB is standard PostgreSQL. Migrate to any Postgres host with pg_dump. Supabase has auth/RLS tightly coupled to its platform.                     |
| BAA availability    | NeonDB offers BAAs on paid plans. Comparable to Supabase Enterprise.                                                                                 |
| Terraform provider  | Official NeonDB Terraform provider for IaC. Supabase Terraform support is limited.                                                                   |

## 4.2 NeonDB Setup

### 4.2.1 Project & Branch Structure

```
# Neon project structure (managed via Terraform) neon_project: clearnote   main branch:    production DB (protected, no direct writes from dev)   dev branch:     daily development (branched from main)   staging branch: CI/CD integration tests (auto-created per PR via GitHub Actions)   test branch:    unit + integration tests (reset after each test run)
---
```

### 4.2.2 Terraform Resource

```
# main.tf resource "neon_project" "clearnote" {   name      = "clearnote"   region_id = "aws-ap-south-1"  # Mumbai — closest to India   pg_version = 16 } resource "neon_branch" "production" {   project_id = neon_project.clearnote.id   name       = "production" } resource "neon_branch" "development" {   project_id = neon_project.clearnote.id   parent_id  = neon_branch.production.id   name       = "dev" }
---
```

## 4.3 Connecting from FastAPI

Use asyncpg (async driver) with the Neon serverless connection string. NeonDB provides connection pooling built-in via the pooler endpoint:

```
# pip install asyncpg sqlalchemy[asyncio] from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession from sqlalchemy.orm import sessionmaker # Use the pooler endpoint for serverless environments (not the direct endpoint) # Format: postgresql+asyncpg://user:pass@ep-xxx.pooler.eu-west-2.aws.neon.tech/clearnote?sslmode=require DATABASE_URL = get_secret('NEON_DATABASE_URL')  # from AWS Secrets Manager engine = create_async_engine(     DATABASE_URL,     pool_size=10,     max_overflow=5,     pool_timeout=30,     echo=False  # set True for debug only ) AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) async def get_db():     async with AsyncSessionLocal() as session:         yield session
---
```

## 4.4 Enabling pgvector on NeonDB

```
-- Run once on the NeonDB console or via migration CREATE EXTENSION IF NOT EXISTS vector; -- guideline_chunks table with 1536-dim embedding (text-embedding-3-small) CREATE TABLE guideline_chunks (     id          SERIAL PRIMARY KEY,     source      TEXT NOT NULL,     page        INT,     content     TEXT NOT NULL,     embedding   vector(1536) ); -- IVFFlat index for approximate nearest-neighbour search -- Build AFTER seeding all chunks (better index quality) CREATE INDEX ON guideline_chunks USING ivfflat (embedding vector_cosine_ops)     WITH (lists = 100);
---
```

## 4.5 Database Branching Workflow

NeonDB branches are copy-on-write snapshots created in seconds — no data copying. This enables a true database-per-environment workflow:

| **Scenario**       | **NeonDB Branch Workflow**                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Local development  | Developers connect to the dev branch. Schema changes are applied here first.                                         |
| New feature branch | neon branches create --name feature/rag-improvements --parent dev. Instant clone.                                    |
| Pull request       | GitHub Actions creates a staging branch from main, runs migrations + tests, then deletes it on PR close.             |
| Database migration | Apply with Alembic on the dev branch, review, then promote to main via Neon’s merge (or re-apply migration on main). |
| Hotfix             | Branch from production, apply fix, test, merge. Production data is never touched until the merge.                    |
| Reset test data    | neon branches reset test-branch — restores the branch to its parent state instantly.                                 |

## 4.6 Row-Level Security on NeonDB

NeonDB RLS uses standard PostgreSQL RLS syntax. Since we’re no longer using Supabase Auth’s auth.uid() function, we pass the doctor_id as a connection-level setting instead:

```
-- Set the doctor context at the start of each request (FastAPI middleware) SET LOCAL app.current_doctor_id = '{{doctor_id_from_jwt}}'; -- RLS policy reads the session variable ALTER TABLE patients ENABLE ROW LEVEL SECURITY; CREATE POLICY doctor_isolation ON patients     USING (doctor_id = current_setting('app.current_doctor_id')::uuid); -- Apply same policy to all PHI tables CREATE POLICY doctor_isolation ON consultations     USING (doctor_id = current_setting('app.current_doctor_id')::uuid); CREATE POLICY doctor_isolation ON soap_notes     USING (consultation_id IN (         SELECT id FROM consultations         WHERE doctor_id = current_setting('app.current_doctor_id')::uuid     ));
---
```

```
# FastAPI middleware — set RLS context before every DB operation async def set_rls_context(db: AsyncSession, doctor_id: str):     await db.execute(         text("SET LOCAL app.current_doctor_id = :did"),         {'did': doctor_id}     ) # In every endpoint: @app.get('/api/patients') async def list_patients(doctor=Depends(get_current_doctor), db=Depends(get_db)):     await set_rls_context(db, doctor['doctor_id'])     return await db.execute(select(Patient))  # RLS filters automatically
---
```

## 4.7 NeonDB Migrations with Alembic

```
# pip install alembic asyncpg alembic init alembic # alembic/env.py — use async engine from sqlalchemy.ext.asyncio import create_async_engine # Generate a migration after model changes: alembic revision --autogenerate -m "add consent fields to patients" # Apply to dev branch: alembic upgrade head # GitHub Actions applies migrations to staging branch on each PR: # DATABASE_URL=<staging_branch_url> alembic upgrade head
---
```

# 5. Database Schema (NeonDB)

The schema is updated to reflect Clerk user IDs (string, not UUID) as the primary auth identifier, and NeonDB’s connection-parameter RLS approach.

| **Table**              | **Key Columns**                                                                                                                                                            | **Notes**                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| doctors                | id (UUID PK), clerk_user_id (TEXT UNIQUE), name, email, signature_url, license_no, is_mfa_enabled, last_login_at                                                           | clerk_user_id is the Clerk user ID (format: user_xxxx). Used in RLS SET LOCAL. |
| patients               | id (UUID PK), doctor_id (UUID FK), name, phone, email, dob, deleted_at, consent_given_at, consent_version                                                                  | Soft delete via deleted_at. RLS filters by doctor_id.                          |
| consultations          | id (UUID PK), patient_id, doctor_id, created_at, audio_s3_key, status (PENDING│PROCESSING│COMPLETE│FAILED), whisper_job_id, duration_seconds, processing_error, deleted_at | Status machine for async pipeline tracking.                                    |
| soap_notes             | id (UUID PK), consultation_id, subjective, objective, assessment, plan, raw_transcript, edited_by_doctor (BOOL), edit_history (JSONB)                                      | JSONB edit history for audit trail.                                            |
| medications            | id (UUID PK), consultation_id, name, dosage, frequency, duration, route, rag_checked (BOOL), rag_verdict (TEXT)                                                            | RAG check status per medication.                                               |
| diagnoses              | id (UUID PK), consultation_id, icd_code, description                                                                                                                       | ICD-10 codes extracted by Groq.                                                |
| interactions           | id (UUID PK), consultation_id, drug_a, drug_b, severity, guideline_ref, mechanism, recommendation, confidence                                                              | RAG interaction verdict per drug pair.                                         |
| audit_logs             | id (UUID PK), doctor_id, action, resource_type, resource_id, ip_address, user_agent, created_at                                                                            | Immutable via RLS (no UPDATE/DELETE policy).                                   |
| data_deletion_requests | id, patient_id, requested_at, completed_at, requested_by                                                                                                                   | GDPR/HIPAA right-to-deletion workflow.                                         |
| guideline_chunks       | id (SERIAL PK), source, page, content, embedding vector(1536)                                                                                                              | IVFFlat index on embedding column.                                             |

# 6. HIPAA & Privacy Compliance

This section is updated to reflect Clerk and NeonDB as the auth and database providers respectively. All controls from v2.0 are retained and updated.

## 6.1 Encryption at Rest

| **Data Store**                | **Mechanism**                                     | **Action Required**                              |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| NeonDB Postgres               | AES-256 (enabled by default on all Neon projects) | Verify in Neon dashboard; no extra config needed |
| AWS S3 (audio + PDFs)         | SSE-S3 (AES-256)                                  | Enable in bucket settings + Terraform            |
| Upstash Redis (session cache) | TLS + AES-256 at rest                             | Enabled by default on Upstash                    |
| Lambda env vars / secrets     | AWS Secrets Manager (KMS)                         | Store all API keys here, not .env                |

## 6.2 Encryption in Transit

- All API endpoints served over HTTPS/TLS 1.2+. Enforce via Vercel (frontend) and Railway/Render (backend).

- WebSocket connections use WSS. FastAPI-Starlette handles this automatically behind a TLS-terminating proxy.

- NeonDB connections require sslmode=require in the connection string. NeonDB enforces this server-side.

- S3 pre-signed URLs use HTTPS and expire after 15 minutes.

- Clerk API calls use HTTPS. The JWKS endpoint is HTTPS-only.

## 6.3 Access Control

- Clerk enforces authentication (who you are) — TOTP MFA required, session management, token rotation.

- FastAPI enforces authorisation (what you can do) — JWT verification, doctor_id extraction, RLS context setting.

- NeonDB RLS enforces data isolation (what you can see) — SET LOCAL ensures queries are always scoped to the verified doctor_id.

- S3 objects are never publicly accessible. All access via pre-signed URLs scoped to the requesting session.

- Lambda uses an IAM role with least-privilege permissions (read/write specific S3 prefix only).

## 6.4 Audit Logging

- audit_logs table: doctor_id, action (READ|WRITE|DELETE|EXPORT), resource_type, resource_id, ip_address, user_agent, timestamp.

- FastAPI middleware writes an audit record on every request touching PHI tables.

- Logs are immutable: RLS on audit_logs has INSERT policy only (no UPDATE or DELETE policy).

- Retain for 6 years (HIPAA minimum). Monthly export to S3 Glacier for cold storage.

## 6.5 BAA Readiness (Updated for Clerk + NeonDB)

| **Vendor**        | **BAA Available?**    | **Note**                                                   |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| AWS (S3, Lambda)  | Yes (via AWS console) | Required for audio + PDFs                                  |
| NeonDB            | Yes (Scale plan)      | Free plan does not include BAA; upgrade for production     |
| Clerk             | Yes (Enterprise plan) | Free/Pro plans do not include BAA; contact Clerk sales     |
| OpenAI (Whisper)  | Yes (on request)      | Must opt out of training data use                          |
| Groq              | Contact sales         | Verify before handling real patient data                   |
| Twilio            | Yes                   | Required for SMS with PHI                                  |
| SendGrid (Twilio) | Yes                   | Required if email contains PHI                             |
| Upstash           | Contact sales         | Or replace with ElastiCache on AWS (has BAA)               |
| Sentry            | Yes (paid plans)      | Scrub PHI from error payloads before they leave the server |

```
**Portfolio / Demo Note**
---
For a demo or hackathon project with synthetic (fake) patient data, strict BAA compliance is not legally required.
Clearly label the app as a demo and never record real patient consultations without all vendor BAAs in place.
NeonDB and Clerk free tiers are fully functional for demo purposes — just document the BAA gap as a known production blocker.
```

# 7. Security Hardening

## 7.1 API Security

- Rate limiting on all endpoints: 60 requests/min per IP (use slowapi in FastAPI).

- Request size limits: reject audio chunks > 5 MB per WebSocket message; total audio capped at 100 MB.

- CORS locked to the production frontend domain only. No wildcard origins.

- HTTP security headers (FastAPI middleware): Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Content-Security-Policy.

- Dependency scanning: GitHub Actions runs pip-audit and npm audit on every push.

- Clerk session tokens are HttpOnly cookies — not accessible to JavaScript, preventing XSS token theft.

## 7.2 Input Validation & Injection Prevention

- All DB queries use SQLAlchemy ORM with parameterised queries. No raw SQL string interpolation.

- The SET LOCAL RLS context uses a parameterised asyncpg execute call. The doctor_id is a verified JWT claim — never user-supplied input.

- Patient-supplied data validated and sanitised by Pydantic models in FastAPI.

- LLM outputs treated as untrusted strings. Groq JSON parsed through Pydantic; parse failures fall back to empty SOAP note with a warning.

- PDF generation uses server-side templates only. Doctor-editable fields are HTML-escaped before rendering.

## 7.3 Secret Management

- Zero secrets in code or environment variables in production. All API keys stored in AWS Secrets Manager.

- NEON*DATABASE_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, OPENAI_API_KEY, GROQ_API_KEY, TWILIO*\*, SENDGRID_API_KEY all stored in Secrets Manager.

- Lambda functions retrieve secrets via boto3 at cold-start and cache in memory for the function lifetime.

- GitHub Actions uses GitHub Secrets for CI/CD pipeline credentials.

- Clerk’s publishable key (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) is safe to expose in the frontend — it is not a secret.

# 8. Error Handling & Resilience

| **Component**     | **Failure Mode**                     | **Mitigation**                                                                                                                       |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Clerk JWKS fetch  | JWKS endpoint unavailable            | Cache JWKS in Upstash Redis (TTL 1 hour). Serve cached keys on fetch failure. Alert if cache also misses.                            |
| NeonDB connection | Pool exhausted or cold-start latency | Pool size=10, overflow=5. Use pooler endpoint (not direct). NeonDB wakes in <500ms from idle on paid plan.                           |
| Whisper API       | Timeout or 5xx from OpenAI           | Lambda retries 3x with exponential backoff. DLQ captures repeated failures. Consultation status → FAILED with error stored.          |
| Groq LLM          | Malformed JSON output                | Pydantic parse with fallback empty SOAP. Doctor sees warning banner. Raw transcript always saved.                                    |
| pgvector RAG      | No relevant chunks found             | Return 'No guideline found' verdict with confidence=0. Never silently skip the check.                                                |
| S3 upload         | Network timeout during audio upload  | Client retries with multi-part upload. Progress bar shows real state.                                                                |
| WebSocket drop    | Doctor loses connection mid-session  | Upstash Redis caches interim transcript. Reconnect restores state automatically.                                                     |
| Twilio SMS        | Invalid phone / quota exceeded       | Log delivery failure. Email fallback. Do not crash the consultation save.                                                            |
| NeonDB migration  | Failed Alembic migration on deploy   | Alembic runs in a pre-deploy step. If it fails, deploy is aborted. Main branch is never touched until migration succeeds on staging. |

# 9. RAG Layer — Detailed Implementation

## 9.1 Guideline Ingestion Pipeline

- Download WHO Essential Medicines guidelines and ICMR Standard Treatment Guidelines (freely available PDFs).

- Extract text using pdfplumber (handles multi-column layouts better than PyPDF2).

- Clean text: remove headers/footers, fix hyphenation, normalise whitespace.

- Chunk at ~400 tokens with 50-token overlap using LangChain’s RecursiveCharacterTextSplitter.

- Embed each chunk with text-embedding-3-small (1536 dimensions).

- Store in guideline_chunks on NeonDB: {id, source, page, content, embedding vector(1536)}.

- Build IVFFlat index on the embedding column after all chunks are inserted.

## 9.2 Inference Query

- Embed the query: 'drug interaction between {drugA} and {drugB} in {diagnosis_context}'.

- Cosine similarity search on NeonDB: SELECT content FROM guideline_chunks ORDER BY embedding <=> $1 LIMIT 3.

- Pass top-3 chunks + query to Groq with structured prompt requesting: severity, mechanism, recommendation, source_reference, confidence.

- Parse response into Interaction record and save to NeonDB.

- Interactions with severity MODERATE or SEVERE are highlighted with a warning badge in the UI.

## 9.3 Hallucination Mitigation

- Always include raw guideline chunk text in the LLM prompt as grounding context.

- Prompt instructs model: 'If the provided context does not support a conclusion, respond with severity: NONE and a note that no guideline evidence was found.'

- UI labels each verdict with its source (e.g., WHO EML 2023, p.47) so the doctor can independently verify.

- Confidence scores below 0.6 display a 'Low confidence — verify manually' warning.

# 10. Testing Strategy

## 10.1 Unit Tests (Python — pytest)

- Auth middleware: assert requests with invalid or expired Clerk JWTs receive 401. Mock the JWKS fetch.

- RLS context setter: assert SET LOCAL is called with the correct doctor_id on every DB-touching endpoint.

- SOAP extraction: feed 5 synthetic transcripts and assert the Pydantic model parses without error.

- RAG query builder: mock the NeonDB asyncpg client, verify the embedding query and parameter format.

- PDF renderer: generate a PDF from synthetic SOAP note, assert file is non-empty and valid.

## 10.2 Integration Tests (NeonDB test branch)

- Auth flow end-to-end: Clerk test mode → JWT → FastAPI verify → NeonDB RLS query. Assert 401 on bad tokens.

- RLS isolation: create two doctor records in the test branch. Assert doctor A’s API calls never return doctor B’s patients.

- Whisper pipeline: use LocalStack for S3 + Lambda. Feed a 30-second synthetic audio file.

- NeonDB branch lifecycle: GitHub Actions creates a branch, runs migrations, runs tests, drops the branch.

## 10.3 Frontend Tests (Playwright)

- Sign in flow: use Clerk’s test mode email/OTP to simulate a doctor logging in.

- Record a consultation: simulate MediaRecorder events, verify WebSocket message flow.

- SOAP note editing: type in each field, submit, assert changes persist on page reload.

- Drug interaction badge: mock API response with SEVERE interaction, verify badge renders.

```
**Important: Synthetic Test Data Only**
---
Generate synthetic patients using the Faker library (pip install faker).
Store synthetic fixtures in tests/fixtures/ with explicit 'SYNTHETIC DATA — NOT REAL PHI' labels.
NeonDB’s test branch is reset after each test run (neon branches reset test-branch) to prevent data accumulation.
```

# 11. Enhanced 15-Day Build Plan (v3.0)

| **Days** | **Tasks**                                                                                                                                                                                                 | **Changes vs v2.0**                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1–2      | Repo setup, Next.js + Clerk ClerkProvider, FastAPI skeleton, NeonDB project via Terraform (main + dev + test branches), pgvector extension, Alembic setup, GitHub Actions with pip-audit.                 | NeonDB branches instead of Supabase, Alembic migrations, Clerk setup  |
| 3–4      | Clerk SignIn/SignUp components in Next.js, clerkMiddleware for route protection, JWKS JWT verification in FastAPI, Clerk webhook endpoint for doctor auto-provisioning, doctor CRUD, NeonDB RLS policies. | Entire auth section replaced with Clerk + JWKS verification + webhook |
| 5–6      | Patient CRUD with soft deletes and consent tracking, audit_log table and FastAPI middleware, dashboard list view.                                                                                         | Consent fields, audit logging, soft deletes                           |
| 7–8      | MediaRecorder, WSS WebSocket, S3 upload with SSE-S3, Lambda trigger, Whisper batch transcription, SQS DLQ, status machine (PENDING→PROCESSING→COMPLETE│FAILED).                                           | SSE-S3, DLQ, status machine                                           |
| 9–10     | Groq SOAP extraction with Pydantic validation, fallback for malformed JSON, edit history tracking. NeonDB Alembic migration for new fields.                                                               | Pydantic schema, Alembic migration workflow                           |
| 11–12    | Guideline ingestion pipeline (pdfplumber → chunk → embed → NeonDB pgvector), RAG cosine similarity query, Groq interaction verdict, hallucination mitigation prompt, source citations in UI.              | NeonDB pgvector with IVFFlat index                                    |
| 13–14    | PDF generation (weasyprint), pre-signed S3 URLs, Sentry with PHI scrubbing, SendGrid + Twilio with delivery status webhooks, full pytest + Playwright test suite.                                         | PHI scrubbing, delivery webhooks, full tests                          |
| 15       | Security headers, rate limiting (slowapi), NeonDB production branch promotion, README with architecture diagram, demo video, full Terraform deploy.                                                       | NeonDB branch promotion workflow                                      |

# 12. Deployment Architecture

## 12.1 Terraform Resources (Updated)

- neon_project + neon_branch resources: main, dev, staging branches via the official NeonDB Terraform provider.

- aws_s3_bucket: audio-store and pdf-store with SSE-S3, versioning, public access blocked.

- aws_s3_bucket_lifecycle_configuration: 90-day deletion on audio bucket.

- aws_lambda_function: transcription-worker (512 MB, 5-min timeout).

- aws_sqs_queue: transcription-dlq as dead-letter queue (max 3 retries).

- aws_iam_role + aws_iam_policy: least-privilege for Lambda (S3 read/write, SQS send only).

- aws*secretsmanager_secret: NEON_DATABASE_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, OPENAI_API_KEY, GROQ_API_KEY, TWILIO*\*, SENDGRID_API_KEY.

## 12.2 CI/CD Pipeline

- On pull request: pip-audit, npm audit, pytest (test branch), Playwright, Alembic dry-run on staging branch.

- On push to main: run all tests, Terraform plan (posted as PR comment).

- On release tag: Alembic upgrade on production branch, Terraform apply, deploy backend to Railway, deploy frontend to Vercel.

## 12.3 Environment Separation

| **Environment**   | **DB Branch**                               | **Auth**                                              |
| ----------------- | ------------------------------------------- | ----------------------------------------------------- |
| Local development | NeonDB dev branch                           | Clerk development instance (separate publishable key) |
| Staging (CI/CD)   | NeonDB staging branch (auto-created per PR) | Clerk test mode                                       |
| Production        | NeonDB main branch (protected)              | Clerk production instance with MFA enforced           |

# 13. Known Limitations & Future Roadmap

## 13.1 Current Limitations (v3.0)

| **Limitation**                           | **Impact & Mitigation**                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| No real-time Whisper streaming           | Batch approach used. Describe as 'async transcription with real-time LLM streaming output'.   |
| Clerk + NeonDB free tiers have no BAA    | Acceptable for demo. Production requires Clerk Enterprise + NeonDB Scale.                     |
| NeonDB free tier pauses after inactivity | Paid plan ($19/mo) keeps compute warm. Free tier has <500ms wake time — acceptable for demos. |
| Clerk JWKS fetch latency                 | Cache in Upstash Redis (TTL 1 hour) to avoid per-request fetches.                             |
| No patient portal                        | Patients receive output passively. Future portal via Clerk magic links.                       |
| English-only transcription               | Whisper supports 97 languages; multi-language is a config change.                             |
| Single doctor per account                | Multi-tenancy is a schema + RLS + Clerk Organisations extension, not a rewrite.               |

## 13.2 Post-v1 Roadmap

- Real-time streaming transcription via AssemblyAI real-time WebSocket API.

- Clerk Organisations for multi-clinic tenancy with org-level MFA enforcement.

- Patient portal: Next.js app with Clerk magic link authentication for patients.

- ICD-10 code auto-suggestion using a fine-tuned medical NER model.

- Voice note semantic search: embed all transcripts and enable search across consultation history.

- Regulatory certification: formal HIPAA risk assessment, penetration test, and BAAs for production.

# Appendix A: Environment Variables Reference

| **Variable**                      | **Description**                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk publishable key (safe to expose in frontend)                                               |
| CLERK_SECRET_KEY                  | Clerk secret key (backend only — never expose). Store in Secrets Manager.                        |
| CLERK_WEBHOOK_SECRET              | Svix webhook signing secret for /webhooks/clerk endpoint.                                        |
| NEON_DATABASE_URL                 | NeonDB pooler connection string with sslmode=require (asyncpg format).                           |
| AWS_ACCESS_KEY_ID / SECRET        | IAM credentials for S3 and Lambda (use IAM roles in Lambda, not keys).                           |
| S3_AUDIO_BUCKET                   | S3 bucket name for audio storage.                                                                |
| S3_PDF_BUCKET                     | S3 bucket name for PDF storage.                                                                  |
| OPENAI_API_KEY                    | For Whisper transcription and text-embedding-3-small.                                            |
| GROQ_API_KEY                      | For Llama 3 70B SOAP extraction and RAG verdicts.                                                |
| TWILIO_ACCOUNT_SID / AUTH_TOKEN   | For SMS reminders.                                                                               |
| TWILIO_PHONE_NUMBER               | Sender phone number.                                                                             |
| SENDGRID_API_KEY                  | For email delivery.                                                                              |
| REDIS_URL                         | Upstash Redis connection string (WSS protocol). Used for JWKS cache + session cache.             |
| SENTRY_DSN                        | Sentry project DSN for error tracking.                                                           |
| CLERK_JWKS_URL                    | Your Clerk frontend API JWKS URL: https://<your-domain>.clerk.accounts.dev/.well-known/jwks.json |

# Appendix B: Prompt Engineering Reference

## B.1 SOAP Extraction Prompt (Groq)

```
You are a clinical documentation assistant. Given a doctor-patient consultation transcript, extract a structured SOAP note and medication list. Rules: - Only use information explicitly stated in the transcript. - Do not infer diagnoses not mentioned by the doctor. - If a field has no information, return an empty string. - Return ONLY valid JSON matching the schema below. Schema: { subjective, objective, assessment, plan,   medications: [{name, dosage, frequency, duration, route}],   diagnoses: [{icd_code, description}],   allergies: [string], confidence: 0.0-1.0 }
---
```

## B.2 RAG Interaction Verdict Prompt

```
You are a clinical pharmacology assistant. Based ONLY on the provided guideline context, assess the interaction. Context: {top_3_rag_chunks} Drug A: {drugA} │ Drug B: {drugB} If the context does not support a conclusion, set severity to NONE. Return JSON: { severity: NONE│MILD│MODERATE│SEVERE,   mechanism, recommendation, source_reference, confidence }
---
```

# Appendix C: Cost Estimate

Based on a demo/portfolio scenario with ~100 synthetic consultations per month, averaging 10 minutes each.

| **Service**            | **Usage**                               | **Est. Monthly Cost**         |
| ---------------------- | --------------------------------------- | ----------------------------- |
| Clerk                  | < 10K MAUs                              | $0 (free tier)                |
| NeonDB                 | < 0.5 GB + < 100 compute hrs            | $0 (free tier)                |
| Whisper API            | 100 consultations × 10 min = 1,000 min  | ~$6.00                        |
| text-embedding-3-small | One-time seed + 200 RAG queries         | < $0.10 (one-time)            |
| Groq (Llama 3 70B)     | 100 SOAP extractions + 300 RAG verdicts | $0 (free tier)                |
| AWS S3                 | ~10 GB audio + PDFs                     | $0 (free tier then ~$0.23/GB) |
| AWS Lambda             | 100 invocations                         | $0 (free tier 1M calls/mo)    |
| Upstash Redis          | Session + JWKS cache                    | $0 (free tier)                |
| Twilio SMS             | ~300 reminder SMS                       | ~$1.50 (after trial credits)  |
| SendGrid               | 100 emails                              | $0 (free tier)                |
| Vercel + Railway       | Hosting                                 | $0 (free tiers)               |
| Sentry + Axiom         | Monitoring                              | $0 (free tiers)               |
| TOTAL                  |                                         | ~$7.60 / month                |

```
**Cost Scaling Note**
---
Clerk scales to $25/mo at 10K MAUs on the Pro plan (includes BAA eligibility on Enterprise).
NeonDB scales to $19/mo on the Launch plan (no pausing, BAA available on Scale plan at $69/mo).
Dominant compute cost remains Whisper at $0.006/min. At 50 consultations/day (20 min avg), consider self-hosted Whisper on a GPU instance.
NeonDB’s serverless scaling means you pay only for compute seconds used — a significant saving over always-on Postgres at scale.
```

---

_ClearNote Enhanced Project Design Document — v3.0_  
_Auth: Clerk · Database: NeonDB · Generated May 2026_
