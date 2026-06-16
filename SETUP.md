# Clearnote - Developer Setup Guide

Welcome to **Clearnote**! This document provides instructions for new collaborators to set up the local development environment, including all external services (S3, Database, Clerk Auth, and Deepgram).

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18+)
- **Python** (v3.12+)
- **uv** (Python packaging & dependency manager)
- **Docker** (for local S3 storage)
- **ngrok** (for Clerk webhooks locally)

---

## 1️⃣ External Services Configuration

You'll need API keys for the following services:

### **Clerk (Authentication)**
1. Create a project at [clerk.com](https://clerk.com).
2. Grab the Publishable Key and Secret Key.
3. Configure an ngrok tunnel to your backend (`ngrok http 8000`).
4. Set up a Webhook in Clerk pointing to `<your-ngrok-url>/webhooks/clerk` and subscribe to `user.created` events.
5. Grab the Webhook Secret key.

### **NeonDB (PostgreSQL)**
1. Create an async PostgreSQL database (we use [NeonDB](https://neon.tech)).
2. Grab the connection string. Ensure it uses `postgresql+asyncpg://`.

### **Deepgram (Transcription)**
1. Create an account at [deepgram.com](https://deepgram.com).
2. Generate an API Key for the Nova-2 Medical transcription model.

---

## 2️⃣ Local S3 Storage (Minio)

We use **Minio** as a local S3-compatible storage for storing consultation audio files before they are sent to Deepgram.

1. **Start Minio** via Docker:
   ```bash
   docker run -d --name minio -p 9000:9000 -p 9001:9001 \
     -e "MINIO_ROOT_USER=test" \
     -e "MINIO_ROOT_PASSWORD=testtest" \
     minio/minio server /data --console-address ":9001"
   ```

2. **Create the Audio Bucket**:
   Install the `mc` CLI (Minio Client) or simply use `awslocal` / AWS CLI to create the bucket:
   ```bash
   # Using AWS CLI
   aws --endpoint-url http://localhost:9000 s3 mb s3://clearnote-audio
   
   # Make it publicly readable (optional, based on your CORS config)
   aws --endpoint-url http://localhost:9000 s3api put-bucket-policy --bucket clearnote-audio --policy '{"Version":"2012-10-17","Statement":[{"Action":["s3:GetObject","s3:PutObject"],"Effect":"Allow","Principal":"*","Resource":["arn:aws:s3:::clearnote-audio/*"]}]}'
   ```

---

## 3️⃣ Backend Setup (FastAPI)

The backend is built with FastAPI, SQLAlchemy (Async), and the Deepgram Python SDK.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Setup virtual environment & install dependencies using `uv`:
   ```bash
   uv venv
   source .venv/bin/activate
   uv pip install -e .
   # or simply sync
   uv sync
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory based on `.env.example`:
   ```ini
   DATABASE_URL='postgresql+asyncpg://<YOUR_NEON_DB_URL>'
   
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_AUTHORIZED_PARTIES=["http://localhost:3000"]
   CLERK_WEBHOOK_SECRET=whsec_...
   
   FRONTEND_URL=http://localhost:3000
   
   AWS_ACCESS_KEY_ID=test
   AWS_SECRET_ACCESS_KEY=testtest
   AWS_REGION=us-east-1
   AWS_ENDPOINT_URL=http://localhost:9000
   AUDIO_BUCKET_NAME=clearnote-audio
   
   DEEPGRAM_API_KEY=your_deepgram_api_key
   ```

4. Run Database Migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the Backend Server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   *The backend will be available at `http://localhost:8000`.*

---

## 4️⃣ Frontend Setup (Next.js)

The frontend is built with Next.js (App Router), TailwindCSS, and Clerk React SDK.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `frontend/` directory:
   ```ini
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
   
   # FastAPI backend URL
   NEXT_PUBLIC_API_URL=http://localhost:8000
   API_URL=http://localhost:8000
   ```

4. Start the Frontend Server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 🔄 Development Workflow

To have everything working properly, you must run the following simultaneously:
1. **Minio Docker Container** (Port 9000)
2. **FastAPI Backend** (Port 8000)
3. **Next.js Frontend** (Port 3000)
4. **ngrok Tunnel** (Port 8000) -> for Clerk to hit your local backend webhook when new users sign up!

> **Note on Transcription:** 
> When testing the Audio Recorder, the frontend captures `webm` chunks and uploads them directly to the Minio S3 bucket via Presigned URLs. Once stopped, the backend asynchronously downloads the audio from Minio and sends it to Deepgram for medical transcription, saving the final SOAP note to the DB.
