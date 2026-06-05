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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">Client Component (Browser Fetch)</h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={fetchProtected}
          disabled={loading}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          GET /protected
        </button>

        <button
          onClick={fetchMe}
          disabled={loading}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          GET /me
        </button>
      </div>

      {loading && <p className="animate-pulse text-sm font-medium text-slate-500">Loading data from FastAPI...</p>}
      {error && <p className="text-sm font-medium text-rose-600">Error: {error}</p>}
      {data && (
        <div className="overflow-hidden rounded-lg bg-slate-900 shadow-inner">
          <div className="bg-slate-800 px-4 py-2">
            <p className="text-xs font-semibold text-slate-300">JSON Response</p>
          </div>
          <pre className="overflow-x-auto p-4 text-xs text-emerald-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
