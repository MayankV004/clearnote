# Authentication & Authorization

This document explains how Clerk JWT authentication works in ClearNote — both on the FastAPI backend and the Next.js frontend.

---

## Architecture Overview

```
Browser / Next.js
     │
     │  1. User signs in via Clerk (handled automatically by ClerkProvider)
     │  2. Clerk issues a short-lived JWT (session token)
     │
     ▼
Next.js Frontend
     │
     │  3. Attach JWT to every API call:
     │     Authorization: Bearer <token>
     │
     ▼
FastAPI Backend
     │
     │  4. get_current_user dependency verifies the JWT
     │     using the Clerk Backend SDK (no DB call needed)
     │
     ▼
  Route handler runs  →  response
```

**Key points:**
- Clerk manages user accounts, sign-in, and token issuance.
- The backend **never stores passwords** — it only verifies JWTs.
- Every token is verified on every request (stateless auth).

---

## Backend

### Stack

| Package | Purpose |
|---|---|
| `clerk-backend-api` | Verifies Clerk JWTs without a network call (uses JWKS) |
| `pydantic-settings` | Loads config from `.env` |
| `fastapi` + `uvicorn` | Web framework and ASGI server |

### Environment Variables

File: `backend/.env`

```env
CLERK_SECRET_KEY='sk_test_...'             # From Clerk Dashboard → API Keys
CLERK_PUBLISHABLE_KEY='pk_test_...'        # From Clerk Dashboard → API Keys
CLERK_AUTHORIZED_PARTIES='["http://localhost:3000"]'  # Must match your frontend origin exactly

DATABASE_URL='postgresql+asyncpg://...'
FRONTEND_URL='http://localhost:3000'
```

> [!IMPORTANT]
> `CLERK_AUTHORIZED_PARTIES` must **exactly** match the origin your frontend runs on.
> In production, change it to your deployed URL (e.g. `["https://clearnote.app"]`).

### The Auth Dependency — `app/deps/auth.py`

This is the **single source of truth** for authentication. All route protection flows through here.

```python
from app.deps.auth import CurrentUser, get_current_user
```

**What it does:**

1. Reads the `Authorization: Bearer <token>` header from the incoming request.
2. Calls `clerk_backend_api.authenticate_request()` which verifies the JWT signature using Clerk's public JWKS (cached locally — no network roundtrip on every request).
3. Checks that the token's `azp` (authorized party) matches `CLERK_AUTHORIZED_PARTIES`.
4. Returns a `RequestState` object on success, or raises **HTTP 401** on failure.

**`RequestState` payload fields** (available after successful auth):

| Field | Type | Description |
|---|---|---|
| `state.payload["sub"]` | `str` | Clerk userId — e.g. `"user_2abc123"` |
| `state.payload["sid"]` | `str` | Session ID |
| `state.payload["exp"]` | `int` | Token expiry (Unix timestamp) |
| `state.payload["azp"]` | `str` | Authorized party (your frontend origin) |

### Protecting a Route

Use the `CurrentUser` type alias — it's one import and one annotation:

```python
from app.deps.auth import CurrentUser

@router.get("/your-route")
async def your_route(state: CurrentUser):
    user_id = state.payload["sub"]   # Clerk userId
    return {"user_id": user_id}
```

`CurrentUser` is a type alias for `Annotated[RequestState, Depends(get_current_user)]`.
Adding it to a route parameter is all it takes to require authentication.

### Public Routes

Simply omit the dependency:

```python
@router.get("/public")
async def public_route():
    return {"message": "No auth required"}
```

### Fetching the Full User from Clerk

When you need the user's name or email (not just their ID), call the Clerk Backend API:

```python
import clerk_backend_api
from app.core.config import settings

_clerk = clerk_backend_api.Clerk(bearer_auth=settings.CLERK_SECRET_KEY)

@router.get("/me")
async def me(state: CurrentUser):
    user_id = state.payload["sub"]
    user = _clerk.users.get(user_id=user_id)

    primary_email = next(
        (e.email_address for e in user.email_addresses if e.id == user.primary_email_address_id),
        None,
    )

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": primary_email,
    }
```

> [!NOTE]
> `_clerk.users.get()` makes a network call to the Clerk API.
> Only use it when you need fields beyond what's in the JWT (name, email, image, etc.).
> For the userId alone, always prefer `state.payload["sub"]`.

### Error Responses

When auth fails, the backend returns:

```json
HTTP 401 Unauthorized
WWW-Authenticate: Bearer

{
  "detail": "Token expired"
}
```

Common `detail` values:

| Message | Cause |
|---|---|
| `"Token expired"` | JWT `exp` has passed — frontend must call `getToken()` again |
| `"Not authenticated"` | No `Authorization` header sent |
| `"Invalid authorized party"` | `CLERK_AUTHORIZED_PARTIES` doesn't match the frontend origin |
| `"Invalid JWT signature"` | Wrong `CLERK_SECRET_KEY` or tampered token |

### Starting the Dev Server

```bash
uv run uvicorn app.main:app --reload
```

> [!WARNING]
> Always use `uv run` — never plain `uvicorn` or `python -m uvicorn`.
> The virtual environment is managed by `uv` and plain commands won't find the right packages.

---

## Frontend (Next.js 14 App Router)

### Environment Variables

File: `frontend/.env`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_API_URL=http://localhost:8000   # used by Client Components
API_URL=http://localhost:8000               # used by Server Components / Route Handlers
```

> [!IMPORTANT]
> - `NEXT_PUBLIC_*` variables are **exposed to the browser**. Only put public keys here.
> - `API_URL` (no `NEXT_PUBLIC_`) is server-only. Use it in Server Components and Route Handlers.
> - `CLERK_SECRET_KEY` is server-only and must **never** be prefixed with `NEXT_PUBLIC_`.

### Clerk Setup

`ClerkProvider` is already wrapping the entire app in `src/app/layout.tsx`. No additional setup is needed — Clerk handles sign-in UI, session management, and token refresh automatically.

### Golden Rule: Always Call `getToken()` Fresh

> [!CAUTION]
> **Never store or cache the JWT.** Clerk tokens expire frequently (typically every 60 seconds).
> Call `getToken()` right before every `fetch()` call. This is cheap — Clerk caches the token
> internally and only makes a network call when it's about to expire.

```ts
// ✅ Correct — fresh token on every call
const token = await getToken();
const res = await fetch(`${API}/endpoint`, {
  headers: { Authorization: `Bearer ${token}` },
});

// ❌ Wrong — never store the token in state or a variable that persists
const [token, setToken] = useState<string | null>(null); // DON'T DO THIS
```

### Pattern 1: Client Component

Use this when the component needs interactivity (buttons, forms, etc.).

```tsx
"use client";

import { useAuth } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function MyClientComponent() {
  const { getToken, isSignedIn } = useAuth();

  async function callApi() {
    const token = await getToken();   // fresh every time

    const res = await fetch(`${API}/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    // ...
  }

  if (!isSignedIn) return <p>Please sign in.</p>;

  return <button onClick={callApi}>Call API</button>;
}
```

### Pattern 2: Server Component

Use this for data-fetching components that don't need client-side interactivity.
The token is obtained server-side — no JavaScript is sent to the browser for auth.

```tsx
import { auth } from "@clerk/nextjs/server";

const API = process.env.API_URL ?? "http://localhost:8000";

export default async function MyServerComponent() {
  const { getToken, userId } = await auth();

  if (!userId) return <p>Not signed in.</p>;

  const token = await getToken();  // fresh every time

  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",   // always opt out of Next.js fetch cache for authed requests
  });

  const user = await res.json();
  return <p>Hello, {user.first_name}!</p>;
}
```

### Pattern 3: Route Handler (API Route)

Use this when you need a Next.js API route that itself calls the FastAPI backend.

```ts
// src/app/api/some-action/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API = process.env.API_URL ?? "http://localhost:8000";

export async function GET() {
  const { getToken, userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken();  // fresh every time

  const res = await fetch(`${API}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data);
}
```

### Which Pattern to Use?

| Situation | Pattern |
|---|---|
| Interactive UI (buttons, forms) | **Client Component** — `useAuth()` |
| Read-only data display, SEO pages | **Server Component** — `auth()` |
| Next.js API route calling FastAPI | **Route Handler** — `auth()` |

---

## Adding a New Protected Route — Quick Checklist

### Backend

- [ ] Create your router file in `app/api/routes/`
- [ ] Import `CurrentUser` from `app.deps.auth`
- [ ] Add `state: CurrentUser` as a parameter to any route that needs auth
- [ ] Mount the router in `app/main.py` with `app.include_router(...)`

### Frontend

- [ ] Decide: Client Component or Server Component?
- [ ] Call `getToken()` immediately before the `fetch()` — never cache it
- [ ] Pass `Authorization: Bearer <token>` header
- [ ] Add `cache: "no-store"` if using a Server Component or Route Handler

---

## Reference Files

| File | Description |
|---|---|
| `backend/app/deps/auth.py` | `get_current_user` dependency and `CurrentUser` alias |
| `backend/app/core/config.py` | Settings loaded from `.env` |
| `backend/app/api/routes/examples.py` | Example `/public`, `/protected`, `/me` routes |
| `frontend/src/app/dashboard/examples/ProtectedClientExample.tsx` | Client Component example |
| `frontend/src/app/dashboard/examples/ProtectedServerExample.tsx` | Server Component example |
