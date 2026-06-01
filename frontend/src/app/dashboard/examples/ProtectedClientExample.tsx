/**
 * Client Component — calls FastAPI using a fresh Clerk JWT each time.
 *
 * Rules:
 *  - Always call getToken() right before the fetch — never cache the result.
 *  - Pass the token as "Authorization: Bearer <token>".
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ProtectedClientExample() {
  const { getToken, isSignedIn } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchProtected() {
    setLoading(true);
    setError(null);

    // Always get a fresh token — never use a cached one.
    const token = await getToken();

    const res = await fetch(`${API}/protected`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      setError(body.detail ?? "Request failed");
      setLoading(false);
      return;
    }

    setData(await res.json());
    setLoading(false);
  }

  async function fetchMe() {
    setLoading(true);
    setError(null);

    const token = await getToken(); // fresh every call

    const res = await fetch(`${API}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      setError(body.detail ?? "Request failed");
      setLoading(false);
      return;
    }

    setData(await res.json());
    setLoading(false);
  }

  if (!isSignedIn) return <p>Please sign in first.</p>;

  return (
    <div>
      <h2>Client Component — Clerk Auth Demo</h2>

      <button onClick={fetchProtected} disabled={loading}>
        GET /protected
      </button>

      <button onClick={fetchMe} disabled={loading} style={{ marginLeft: 8 }}>
        GET /me
      </button>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
