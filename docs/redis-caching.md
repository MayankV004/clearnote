# Redis Caching with Upstash

This document explains how Redis caching works in ClearNote, why it was added, and how to extend it when you add new features.

---

## Why Redis? The Problem It Solves

Before caching, every API request the frontend made required a full round-trip to PostgreSQL (hosted on Neon, a remote cloud database). The latency breakdown looked like this:

```
Browser → FastAPI → Neon (PostgreSQL) → FastAPI → Browser
          ~5 ms        ~150–200 ms        ~5 ms
                    ^^^^^^^^^^^^^^^^^^^
                    This is the slow part
```

The three biggest pain points were:

1. **`get_current_doctor` runs on every authenticated request.** Every dashboard load, every patient fetch, every consultation action — they all called `SELECT * FROM doctors WHERE clerk_user_id = '...'` against Neon. That's 150–200 ms on every single request just to identify the user.

2. **Consultation status polling.** While a consultation is being transcribed, the frontend polls `GET /consultations/{id}` every few seconds. Each poll was a full DB round-trip even though the status barely changes.

3. **Patient list on dashboard load.** The patient list is fetched on every dashboard visit. The data almost never changes between visits, but the DB was always hit fresh.

Upstash Redis sits in front of the database and answers these repeated reads from memory in **~5–10 ms** instead of ~150–200 ms.

```
Browser → FastAPI → Upstash Redis (cache HIT)  → Browser   ← fast path
                        ~5 ms

Browser → FastAPI → Upstash Redis (cache MISS) → Neon → FastAPI → Browser
                                                ~150 ms            ← slow path (only on first load)
```

---

## What is Upstash Redis?

**Redis** is an in-memory key-value store. You store data by a string key, and it comes back instantly. Each entry can have a TTL (time-to-live) so stale data is automatically removed.

**Upstash** is a serverless Redis provider. Unlike a traditional Redis instance that requires a persistent TCP connection, Upstash exposes a **REST API** — you talk to it over plain HTTP. This is ideal for:

- Serverless and edge environments
- FastAPI's async architecture (no connection pool to manage)
- Free-tier usage for small apps

Our credentials are stored in `backend/.env`:

```env
UPSTASH_REDIS_REST_URL="https://sacred-crappie-153332.upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## Architecture: The Cache-Aside Pattern

We use the **cache-aside** pattern (also called "lazy loading"). The application code controls what goes in and out of the cache — Redis is never written to automatically.

```
          ┌─────────────────────────────────────────────────────┐
          │                  GET /patients/                     │
          └───────────────────────┬─────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Cache read (Redis)       │
                    │   key: patients:{doctor_id}│
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼──────────────────────────┐
                    │          Cache HIT?                    │
                    └──────┬──────────────────────┬──────────┘
                       YES │                  NO  │
                           │                      │
              ┌────────────▼────────┐  ┌──────────▼──────────────┐
              │  Return cached data │  │  SELECT from PostgreSQL  │
              │  (skip DB entirely) │  │  (~150 ms)               │
              └─────────────────────┘  └──────────┬──────────────┘
                                                  │
                                       ┌──────────▼──────────────┐
                                       │  Write result to Redis  │
                                       │  with TTL (5 min)       │
                                       └──────────┬──────────────┘
                                                  │
                                       ┌──────────▼──────────────┐
                                       │  Return data to client  │
                                       └─────────────────────────┘
```

**Cache Invalidation** — when data changes (e.g. a new patient is created), we delete the relevant Redis key so the next read is forced back to the DB:

```
POST /patients/  →  INSERT into PostgreSQL  →  DELETE "patients:{doctor_id}" from Redis
```

---

## File Structure

```
backend/
└── app/
    ├── core/
    │   └── config.py                  ← UPSTASH_REDIS_REST_URL + TOKEN added here
    └── services/
        ├── cache_service.py           ← The Redis wrapper (NEW)
        ├── patient_service.py         ← Cache-aside for patient reads/writes
        ├── consultation_service.py    ← Cache-aside for consultation reads/writes
        └── doctor_service.py         ← Cache invalidation on onboarding
```

The cache layer also integrates into:

```
app/api/dependencies/auth.py          ← Caches the Doctor DB lookup (biggest win)
```

---

## The Cache Service (`cache_service.py`)

This is the single file that owns all Redis interaction. Everything else imports from here.

```python
from app.services.cache_service import cache, key_patients_list, TTL_PATIENTS_LIST
```

### Key design decisions

**1. Errors are always swallowed.**

```python
async def get(self, key: str) -> Any | None:
    try:
        raw = await self._client.get(key)
        ...
    except Exception as exc:
        logger.warning(f"Cache GET error for key '{key}': {exc}")
        return None   # ← cache miss, falls through to DB
```

If Redis is down or unreachable, every method returns `None` (for reads) or silently does nothing (for writes/deletes). The application continues to work — just slower, without caching. **Redis is a speed optimisation, not a dependency.**

**2. Lazy initialisation with a disabled state.**

```python
self._enabled = bool(
    settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN
)
```

If credentials aren't set (e.g. a developer who hasn't configured Upstash), caching simply doesn't run. The code path is the same; it just always misses.

**3. JSON is the wire format.**

SQLAlchemy ORM objects can't be directly serialised. We use Pydantic response schemas to convert them to clean JSON dictionaries before storing:

```python
# Serialise before storing
doctor_dict = DoctorResponse.model_validate(doctor).model_dump(mode="json")
await cache.set(cache_key, doctor_dict, TTL_DOCTOR)
```

```python
# Deserialise when reading back
cached = await cache.get(cache_key)
if cached is not None:
    doctor = Doctor(**cached)   # reconstruct from dict
    return doctor
```

### TTL Constants

TTLs are defined at the top of `cache_service.py`. They're intentionally short to balance freshness vs. speed:

```python
TTL_DOCTOR = 600          # 10 min  — Doctor profile, changes very rarely
TTL_PATIENTS_LIST = 300   # 5 min   — Patient list, stable between sessions
TTL_PATIENT = 300         # 5 min   — Individual patient record
TTL_CONSULTATIONS = 15    # 15 sec  — Short: list updates after recording finishes
TTL_CONSULTATION = 15     # 15 sec  — Short: polling-friendly during transcription
```

> [!NOTE]
> Consultation TTLs are intentionally 15 seconds. The frontend polls `GET /consultations/{id}` every few seconds while transcription is running. A short TTL means the worst-case delay between transcription finishing and the frontend seeing "COMPLETE" is 15 seconds. The background task also actively invalidates the cache when done, so in practice it's near-instant.

### Cache Key Helpers

Keys are structured as `{resource}:{scope_id}:{optional_id}` to make them human-readable in the Upstash dashboard and easy to invalidate precisely:

```python
def key_doctor(clerk_user_id: str) -> str:
    return f"doctor:clerk:{clerk_user_id}"

def key_patients_list(doctor_id: str) -> str:
    return f"patients:{doctor_id}"

def key_patient(doctor_id: str, patient_id: str) -> str:
    return f"patient:{doctor_id}:{patient_id}"

def key_consultations_list(doctor_id: str, patient_id: str) -> str:
    return f"consultations:{doctor_id}:{patient_id}"

def key_consultation(doctor_id: str, consultation_id: str) -> str:
    return f"consultation:{doctor_id}:{consultation_id}"
```

> [!IMPORTANT]
> Always include the `doctor_id` in cache keys. This is a **multi-tenant** application — two doctors must never see each other's data from the cache.

---

## Where Caching Is Applied

### 1. Doctor Lookup (`auth.py`) — Highest Impact

**Before:** Every single authenticated API request hit the DB to resolve the doctor from their Clerk user ID.

**After:** After the first request, the doctor object is cached for 10 minutes.

```python
# app/api/dependencies/auth.py

async def get_current_doctor(state: CurrentUser, db: AsyncSession = Depends(get_db)) -> Doctor:
    clerk_user_id = state.payload["sub"]
    cache_key = key_doctor(clerk_user_id)

    # Try cache first
    cached = await cache.get(cache_key)
    if cached is not None:
        return Doctor(**cached)    # no DB call at all

    # Miss → hit the DB
    stmt = select(Doctor).where(Doctor.clerk_user_id == clerk_user_id)
    doctor = await db.scalar(stmt)

    # Write to cache for next time
    doctor_dict = DoctorResponse.model_validate(doctor).model_dump(mode="json")
    await cache.set(cache_key, doctor_dict, TTL_DOCTOR)

    return doctor
```

**Invalidation:** When a doctor completes onboarding (`PATCH /doctors/onboarding`), their profile changes. The cache entry is immediately deleted so the next request fetches fresh data.

```python
# app/services/doctor_service.py — inside update_doctor_onboarding()
await cache.delete(key_doctor(doctor.clerk_user_id))
```

---

### 2. Patient List (`patient_service.py`)

**Before:** `GET /patients/` always ran a `SELECT ... ORDER BY created_at DESC` against Postgres.

**After:** Cached for 5 minutes. Only busted when a new patient is created.

```python
# GET: cache-aside
async def get_patients_for_doctor(db, doctor_id):
    ck = key_patients_list(str(doctor_id))

    cached = await cache.get(ck)
    if cached is not None:
        return [Patient(**p) for p in cached]         # ← from Redis, no DB

    # DB fallback
    result = await db.execute(stmt)
    patients = result.scalars().all()

    # Serialise all patients and store the whole list
    serialised = [PatientResponse.model_validate(p).model_dump(mode="json") for p in patients]
    await cache.set(ck, serialised, TTL_PATIENTS_LIST)

    return patients

# POST: invalidate after creating
async def create_patient(db, doctor_id, patient_in):
    ...
    await db.commit()
    await cache.delete(key_patients_list(str(doctor_id)))   # ← bust the list
    return new_patient
```

---

### 3. Consultation Polling (`consultation_service.py`)

This is where the most dramatic improvement happens.

**Before:** While transcription runs (typically 20–60 seconds), the frontend polled `GET /consultations/{id}` every 3 seconds. That's 7–20 DB queries for a single recording session — all returning "PROCESSING".

**After:** Only the first poll hits the DB. Subsequent polls for the same unchanged data come from Redis in ~5 ms.

```python
# GET single consultation
async def get_consultation_by_id(db, doctor_id, consultation_id):
    ck = key_consultation(str(doctor_id), str(consultation_id))

    cached = await cache.get(ck)
    if cached is not None:
        return Consultation(**cached)            # fast path — no DB

    # Slow path: DB + cache write
    consultation = await db.scalar(stmt)
    await cache.set(ck, ConsultationResponse.model_validate(consultation).model_dump(mode="json"), TTL_CONSULTATION)
    return consultation
```

**Critical: Invalidation from the background task**

The transcription runs in a background task (`_run_transcription`) that runs outside the HTTP request lifecycle. When transcription finishes, the task directly invalidates the cache so the **very next** frontend poll sees the new status:

```python
# Inside _run_transcription — after marking COMPLETE:
consultation.status = ConsultationStatus.COMPLETE
await db.commit()

# Immediately bust the cache — don't wait for TTL to expire
await cache.delete(
    key_consultation(str(consultation.doctor_id), consultation_id),
    key_consultations_list(str(consultation.doctor_id), str(consultation.patient_id)),
)
```

The same invalidation happens when transcription **fails**, so the frontend stops polling and shows the error immediately.

---

## Seeing It In Action

### Upstash Console

Visit [console.upstash.com](https://console.upstash.com) → your database → **Data Browser**. As you use the app, you'll see keys appear like:

```
doctor:clerk:user_2abc123xyz          (TTL: 598s)
patients:f47ac10b-58cc-4372-a567...   (TTL: 287s)
consultation:f47ac10b...:9b1e8f...    (TTL: 13s)
```

### Log Output

The cache service logs cache HITs at DEBUG level:

```
2026-06-25 00:50:44 - clearnote - DEBUG - Cache HIT: patients:f47ac10b-...
2026-06-25 00:50:44 - clearnote - DEBUG - Cache invalidated: ('consultation:...',)
```

---

## Adding Caching to a New Endpoint

If you add a new service method that reads from the DB, follow this pattern:

### Step 1 — Define a key helper in `cache_service.py`

```python
def key_something(doctor_id: str, thing_id: str) -> str:
    return f"something:{doctor_id}:{thing_id}"
```

### Step 2 — Add a TTL constant

```python
TTL_SOMETHING = 300   # 5 min — adjust based on how often data changes
```

### Step 3 — Wrap your service read with cache-aside

```python
from app.services.cache_service import cache, key_something, TTL_SOMETHING
from app.schemas.something import SomethingResponse

async def get_something(db, doctor_id, thing_id):
    ck = key_something(str(doctor_id), str(thing_id))

    # 1. Try cache
    cached = await cache.get(ck)
    if cached is not None:
        return Something(**cached)

    # 2. DB fallback
    something = await db.scalar(stmt)
    if not something:
        raise SomethingNotFoundException()

    # 3. Write to cache
    await cache.set(ck, SomethingResponse.model_validate(something).model_dump(mode="json"), TTL_SOMETHING)
    return something
```

### Step 4 — Invalidate on mutations

```python
async def create_something(db, doctor_id, ...):
    ...
    await db.commit()
    await cache.delete(key_something_list(str(doctor_id)))   # bust the list
    return new_something

async def update_something(db, doctor_id, thing_id, ...):
    ...
    await db.commit()
    await cache.delete(key_something(str(doctor_id), str(thing_id)))  # bust the single
```

> [!WARNING]
> Always invalidate the cache in `onSuccess` callbacks (mutations). If you forget, users will see stale data until the TTL expires.

---

## Common Pitfalls

### ❌ Forgetting `doctor_id` in the cache key

```python
# WRONG — two doctors would share the same cache entry
key = f"patients:{patient_id}"

# CORRECT — scoped per doctor
key = f"patients:{doctor_id}:{patient_id}"
```

### ❌ Caching mutable ORM objects directly

SQLAlchemy ORM instances are bound to a database session. You cannot pickle or JSON-serialise them directly. Always go through the Pydantic schema:

```python
# WRONG
await cache.set(key, patient, TTL_PATIENT)   # TypeError: not JSON serialisable

# CORRECT
await cache.set(key, PatientResponse.model_validate(patient).model_dump(mode="json"), TTL_PATIENT)
```

### ❌ Not invalidating after writes

```python
# WRONG — patient list is now stale
async def create_patient(...):
    await db.commit()
    return new_patient   # forgot to call cache.delete()

# CORRECT
async def create_patient(...):
    await db.commit()
    await cache.delete(key_patients_list(str(doctor_id)))
    return new_patient
```

### ❌ Caching data that changes on every request

Don't cache WebSocket connections, streaming responses, or anything that is inherently stateful or real-time. The consultation audio stream endpoint is correctly left uncached.

---

## Reference

| File | Role |
|---|---|
| `backend/app/services/cache_service.py` | Redis client wrapper, TTLs, and key helpers |
| `backend/app/core/config.py` | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` settings |
| `backend/app/api/dependencies/auth.py` | Doctor lookup with caching |
| `backend/app/services/patient_service.py` | Patient read caching + list invalidation |
| `backend/app/services/consultation_service.py` | Consultation caching + background task invalidation |
| `backend/app/services/doctor_service.py` | Doctor cache invalidation on onboarding |

### Environment Variables

```env
# backend/.env

UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

Both variables are optional — if either is missing, caching is automatically disabled and the app falls back to always hitting the DB.
