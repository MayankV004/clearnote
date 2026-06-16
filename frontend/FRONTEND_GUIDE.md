# ClearNote — Frontend Developer Guide

> **Stack:** Next.js 16 (App Router) · TypeScript · TailwindCSS v4 · Clerk · TanStack Query

This guide covers the frontend architecture, folder structure, and how to implement new features using the established patterns. Read this before opening a PR.

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [The Golden Rule](#2-the-golden-rule)
3. [API Client](#3-api-client)
4. [TanStack Query — Data Fetching & Caching](#4-tanstack-query--data-fetching--caching)
   - [Fetching data with `useQuery`](#41-fetching-data-with-usequery)
   - [Creating / mutating data with `useMutation`](#42-creating--mutating-data-with-usemutation)
5. [Shared Utilities (`lib/utils.ts`)](#5-shared-utilities-libutilsts)
6. [Adding a New Feature — Step-by-Step](#6-adding-a-new-feature--step-by-step)
7. [Page Files — Keep Them Thin](#7-page-files--keep-them-thin)
8. [Conventions & Rules](#8-conventions--rules)

---

## 1. Folder Structure

```
frontend/src/
│
├── app/                          # Next.js App Router — ROUTING ONLY
│   ├── (site)/                   # Route group: authenticated app shell
│   │   └── dashboard/
│   │       ├── page.tsx          # Dashboard page (thin — just imports + layout)
│   │       └── patients/
│   │           └── [id]/page.tsx # Patient profile page
│   ├── onboarding/page.tsx
│   ├── sign-in/, sign-up/        # Clerk auth pages
│   ├── layout.tsx                # Root layout: ClerkProvider + ReactQueryProvider
│   └── globals.css
│
├── components/                   # Shared, reusable UI — not tied to any feature
│   ├── providers/
│   │   └── ReactQueryProvider.tsx   # TanStack Query setup & devtools
│   └── debug/
│       └── ClientAuthDiagnostics.tsx
│
├── features/                     # Core of the app — one folder per domain
│   ├── patients/
│   │   ├── api/
│   │   │   ├── usePatients.ts       # GET /patients/  (list)
│   │   │   ├── usePatient.ts        # GET /patients/:id (single)
│   │   │   └── useCreatePatient.ts  # POST /patients/  (create)
│   │   ├── components/
│   │   │   ├── PatientList.tsx
│   │   │   └── CreatePatientModal.tsx
│   │   └── types.ts                 # Patient, CreatePatientPayload
│   │
│   ├── doctor/
│   │   ├── api/
│   │   │   └── useDoctor.ts         # GET /doctors/me
│   │   ├── validations.ts           # Zod schemas for doctor forms
│   │   └── types.ts                 # DoctorProfile
│   │
│   └── consultations/               # Next feature (placeholder)
│       ├── api/
│       ├── components/
│       └── types.ts
│
└── lib/                          # Framework-agnostic utilities
    ├── api-client.ts             # Clerk-aware fetch wrapper (useApiClient hook)
    └── utils.ts                  # Pure helper functions (timeAgo, formatDate, etc.)
```

### What goes where?

| You're building... | Put it in... |
|---|---|
| A new page / route | `app/` |
| A component used only by one feature | `features/<name>/components/` |
| A component reused across features | `components/` |
| An API call for a feature | `features/<name>/api/` |
| A TypeScript type for a feature | `features/<name>/types.ts` |
| A Zod schema for a form | `features/<name>/validations.ts` |
| A utility function (no React) | `lib/utils.ts` |
| Something that doesn't fit | Ask first before creating a new top-level folder |

---

## 2. The Golden Rule

> **`app/` is for routing. `features/` is for logic.**

Pages inside `app/` should be thin wrappers that:
1. Call hooks from `features/`
2. Compose components from `features/`
3. Manage only UI state (modal open/closed, etc.)

They should **never** contain raw `fetch()` calls, type definitions, or business logic.

---

## 3. API Client

**File:** `src/lib/api-client.ts`

A typed `fetch` wrapper that automatically injects the authenticated user's Clerk JWT into every request. You should **never** call `getToken()` or `fetch()` directly in a component or hook — use this instead.

### How to use it

```typescript
import { useApiClient } from "@/lib/api-client";

function useMyHook() {
  const api = useApiClient();

  // GET request
  const data = await api.get<MyType>("/some-endpoint/");

  // POST request
  const created = await api.post<MyType>("/some-endpoint/", { field: "value" });

  // PUT / PATCH / DELETE
  await api.put<MyType>("/some-endpoint/123", { field: "updated" });
  await api.patch<MyType>("/some-endpoint/123", { field: "updated" });
  await api.del("/some-endpoint/123");
}
```

### Error handling

If the server returns a non-2xx status, the client throws an `ApiError`:

```typescript
import { useApiClient, ApiError } from "@/lib/api-client";

try {
  await api.post("/patients/", payload);
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status);  // e.g. 422
    console.log(err.message); // e.g. "Patient with this email already exists"
  }
}
```

> **Note:** When using `useMutation` from TanStack Query, error handling is done for you via the `error` state — you rarely need a try/catch manually.

---

## 4. TanStack Query — Data Fetching & Caching

All data fetching uses [TanStack Query](https://tanstack.com/query/latest). This replaces `useEffect + useState` fetching patterns entirely.

**Why?**
- Data is **cached in memory** — navigating back to a page shows data instantly.
- Automatic **background re-fetching** when data goes stale.
- Automatic **retries** on failure.
- Mutations can **invalidate** related queries to trigger a refresh.

### 4.1 Fetching data with `useQuery`

Create a hook in `features/<name>/api/`. Here is the full pattern:

```typescript
// features/consultations/api/useConsultations.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Consultation } from "../types";

export function useConsultations(patientId: string) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Consultation[]>({
    // The queryKey is the cache identifier.
    // Include all variables the query depends on (e.g. patientId).
    queryKey: ["consultations", patientId],

    queryFn: () => api.get<Consultation[]>(`/consultations/?patient_id=${patientId}`),

    // Only run the query when the user is signed in AND we have an ID.
    enabled: !!isSignedIn && !!patientId,

    // How long (ms) before data is considered stale and a background re-fetch is triggered.
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**Using the hook in a component:**

```tsx
import { useConsultations } from "@/features/consultations/api/useConsultations";

function ConsultationList({ patientId }: { patientId: string }) {
  const { data, isLoading, isError, error } = useConsultations(patientId);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message={error.message} />;

  return (
    <ul>
      {data?.map((c) => <li key={c.id}>{c.id}</li>)}
    </ul>
  );
}
```

#### `staleTime` Guidelines

| Data type | Recommended `staleTime` |
|---|---|
| Patient list | `5 minutes` |
| Single patient profile | `5 minutes` |
| Doctor profile | `10 minutes` |
| Consultations list | `2 minutes` (changes frequently) |
| SOAP note (read-only) | `10 minutes` |

### 4.2 Creating / mutating data with `useMutation`

Use `useMutation` for **POST, PUT, PATCH, DELETE** operations. The key benefit: call `invalidateQueries` on success to automatically refresh related cached data.

```typescript
// features/consultations/api/useCreateConsultation.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { Consultation, CreateConsultationPayload } from "../types";

export function useCreateConsultation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<Consultation, Error, CreateConsultationPayload>({
    mutationFn: (payload) => api.post<Consultation>("/consultations/", payload),

    onSuccess: (newConsultation) => {
      // Tell React Query to refetch any query with this key.
      // The consultation list will update automatically.
      queryClient.invalidateQueries({
        queryKey: ["consultations", newConsultation.patient_id],
      });
    },
  });
}
```

**Using the mutation hook in a component:**

```tsx
import { useCreateConsultation } from "@/features/consultations/api/useCreateConsultation";

function StartConsultationButton({ patientId }: { patientId: string }) {
  // isPending is true while the request is in flight.
  // error is populated automatically if the request fails.
  const { mutateAsync, isPending, error } = useCreateConsultation();

  async function handleClick() {
    await mutateAsync({ patient_id: patientId, status: "PENDING" });
    // After this line, the consultation list is already being refreshed.
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "Starting..." : "Start Consultation"}
    </button>
  );
}
```

> **No more `refreshTrigger` counters.** `invalidateQueries` handles it correctly.

---

## 5. Shared Utilities (`lib/utils.ts`)

These are **pure functions** (no React, no hooks). Import them anywhere.

```typescript
import { timeAgo, formatDate, calculateAge, getInitials, cn } from "@/lib/utils";
```

| Function | Input | Output | Example |
|---|---|---|---|
| `timeAgo(dateStr)` | ISO date string | Relative time string | `"3d ago"`, `"Just now"` |
| `formatDate(dateStr)` | ISO date string or `null` | Formatted date string | `"14 June 2026"` |
| `calculateAge(dob)` | ISO date string or `null` | Age string | `"28 years"` |
| `getInitials(name)` | Full name string | 1–2 uppercase initials | `"Jane Doe" → "JD"` |
| `cn(...classes)` | Class strings / falsy values | Joined class string | `cn("base", isActive && "active")` |

### Usage examples

```typescript
// Displaying a patient's last activity
<span>{timeAgo(patient.created_at)}</span>  // "2d ago"

// Displaying a formatted date (handles null gracefully — returns "—")
<span>{formatDate(patient.dob)}</span>      // "4 March 1998" or "—"

// Avatar initials
<div>{getInitials("Jane Doe")}</div>         // "JD"

// Conditional class merging (avoids ternary clutter)
<div className={cn("base-class", isActive && "active", isError && "error")} />
```

---

## 6. Adding a New Feature — Step-by-Step

Use consultations as a worked example.

### Step 1 — Create the feature directory

```
features/consultations/
  api/
  components/
  types.ts
```

### Step 2 — Define types (`types.ts`)

```typescript
// features/consultations/types.ts

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  audio_s3_key: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface CreateConsultationPayload {
  patient_id: string;
  status: "PENDING";
}
```

### Step 3 — Create API hooks (`api/`)

**Fetch hook:**
```typescript
// features/consultations/api/useConsultations.ts
export function useConsultations(patientId: string) { ... }
```

**Mutation hook:**
```typescript
// features/consultations/api/useCreateConsultation.ts
export function useCreateConsultation() { ... }
```

Refer to [Section 4](#4-tanstack-query--data-fetching--caching) for the full patterns.

### Step 4 — Build components (`components/`)

```tsx
// features/consultations/components/ConsultationList.tsx
"use client";

import { useConsultations } from "../api/useConsultations";

export function ConsultationList({ patientId }: { patientId: string }) {
  const { data, isLoading } = useConsultations(patientId);
  // render list...
}
```

### Step 5 — Use in a page

```tsx
// app/(site)/dashboard/patients/[id]/page.tsx
import { ConsultationList } from "@/features/consultations/components/ConsultationList";

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  // ...
  return <ConsultationList patientId={id} />;
}
```

That's the entire workflow. The page stays thin — all logic lives in the feature.

---

## 7. Page Files — Keep Them Thin

**Good page file (what to aim for):**

```tsx
// app/(site)/dashboard/page.tsx ✅
export default function Dashboard() {
  const { data: patients } = usePatients();   // from features/
  const { data: doctor }   = useDoctor();     // from features/
  const [modal, setModal]  = useState(false); // only local UI state here

  return (
    <main>
      <PatientList />
      <CreatePatientModal isOpen={modal} onClose={() => setModal(false)} />
    </main>
  );
}
```

**Bad page file (what to avoid):**

```tsx
// app/(site)/dashboard/page.tsx ❌
export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const { getToken } = useAuth();

  useEffect(() => {
    const token = await getToken();
    fetch("/patients/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setPatients); // raw fetch inside page = wrong place
  }, []);
}
```

---

## 8. Conventions & Rules

### Naming
| Thing | Convention | Example |
|---|---|---|
| Query hooks | `use` + resource + action | `usePatients`, `usePatient`, `useDoctor` |
| Mutation hooks | `use` + verb + resource | `useCreatePatient`, `useUpdateConsultation` |
| Components | PascalCase | `PatientList`, `CreatePatientModal` |
| Types/Interfaces | PascalCase | `Patient`, `DoctorProfile` |
| Files | camelCase for hooks, PascalCase for components | `usePatients.ts`, `PatientList.tsx` |

### Query Keys
Always use an array. Include all dependencies that affect the data:

```typescript
// ✅ Correct
queryKey: ["patients"]                  // global list
queryKey: ["patients", id]              // specific patient
queryKey: ["consultations", patientId]  // list scoped to a patient
queryKey: ["doctor", "me"]             // current user's profile

// ❌ Avoid
queryKey: ["data"]  // too generic, causes cache collisions
queryKey: "patients" // must be an array
```

### Never do these in components
- ❌ `const { getToken } = useAuth()` — use `useApiClient()` instead
- ❌ `useEffect(() => { fetch(...) }, [])` — use `useQuery` instead
- ❌ `useState` for server data (loading, error, data) — TanStack Query manages all three
- ❌ Define types inline in a page file — put them in `features/<name>/types.ts`

### Always do these
- ✅ Set `enabled: !!isSignedIn` on every query that requires authentication
- ✅ Set a `staleTime` appropriate to how often the data changes
- ✅ Call `invalidateQueries` in `onSuccess` of any mutation that changes list data
- ✅ Handle `isLoading` and `isError` states in every component that fetches data

---

*Last updated: June 2026 · Maintained by the ClearNote team*
