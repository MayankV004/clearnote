# ClearNote Setup Guide

Welcome to the **ClearNote** project! This guide will help you set up the project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v20 or higher) & **npm** - For the Next.js frontend
- **Python** (v3.12 or higher) - For the FastAPI backend
- **uv** - Python package manager (Install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or standard methods)
- **PostgreSQL** - Running locally or via a cloud provider (e.g., NeonDB)
- **Clerk Account** - For authentication

---

## 1. Clone the Repository

```bash
git clone <repository_url>
cd clearnote
```

---

## 2. Backend Setup (FastAPI)

The backend uses FastAPI, SQLAlchemy (async), Alembic for migrations, and `uv` for dependency management.

### Environment Variables

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the `backend` directory. You can ask your partner for the exact development keys, but the structure should be:
   ```env
   # Database Configuration
   DATABASE_URL='postgresql+asyncpg://<username>:<password>@<host>/<database>?ssl=require'

   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY='pk_test_...'
   CLERK_SECRET_KEY='sk_test_...'
   CLERK_AUTHORIZED_PARTIES='["http://localhost:3000"]'
   CLERK_WEBHOOK_SECRET='whsec_...'

   # Frontend URL for CORS
   FRONTEND_URL='http://localhost:3000'
   ```

### Install Dependencies

Install the python dependencies using `uv` which will automatically create a virtual environment (`.venv`) and sync from `uv.lock`:
```bash
uv sync
```

### Run Database Migrations

Apply the latest database schemas using Alembic:
```bash
uv run alembic upgrade head
```

### Start the Backend Server

Start the development server with live-reloading:
```bash
uv run uvicorn app.main:app --reload
```
The backend API will now be running at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

---

## 3. Frontend Setup (Next.js)

The frontend is built with Next.js (App Router), React 19, TailwindCSS v4, and integrates with Clerk for user authentication.

### Environment Variables

1. Open a new terminal and navigate to the `frontend` directory from the root:
   ```bash
   cd frontend
   ```
2. Create a `.env.local` (or `.env`) file with the following variables:
   ```env
   # Clerk Authentication Keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Clerk Routing Configuration
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

   # Backend API URLs
   NEXT_PUBLIC_API_URL=http://localhost:8000   # Used by Client Components
   API_URL=http://localhost:8000               # Used by Server Components / Route Handlers
   ```

### Install Dependencies

Install the Node.js dependencies:
```bash
npm install
```

### Start the Frontend Server

Run the development server:
```bash
npm run dev
```
The frontend will now be running at `http://localhost:3000`.

---

## 4. Webhooks & Account Provisioning (Optional but Recommended)

When a new user signs up via Clerk, a webhook needs to trigger the backend to create a corresponding `Doctor` or `Patient` record in your local database. 

If you are using tools like **ngrok**, you can expose your local backend:
```bash
ngrok http 8000
```
Then, update the Webhook URL in your Clerk Dashboard to point to `https://<your-ngrok-url>.ngrok.io/api/webhooks/clerk` and update the `CLERK_WEBHOOK_SECRET` in your backend `.env` to match the webhook signing secret from Clerk.

## Happy Coding!
If you run into any issues during setup, feel free to reach out to the project maintainers.
