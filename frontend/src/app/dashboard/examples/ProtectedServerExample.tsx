/**
 * Server Component — calls FastAPI from the server using auth() from
 * @clerk/nextjs/server.
 *
 * How it works:
 *  1. auth() reads the Clerk session from the incoming request cookies/headers
 *     (no client round-trip needed).
 *  2. getToken() on the server-side auth object returns a fresh JWT.
 *  3. We pass it to the FastAPI backend as "Authorization: Bearer <token>".
 */

import { auth } from "@clerk/nextjs/server";

const API = process.env.API_URL ?? "http://localhost:8000"; // server-side env var

export default async function ProtectedServerExample() {
  // auth() is async in Next.js 14 App Router when used in Server Components
  const { getToken, userId } = await auth();

  // Redirect or show an error if the user is not signed in
  if (!userId) {
    return <p>Not signed in — cannot call protected API.</p>;
  }

  // Always get a fresh token — never cache the result.
  const token = await getToken();

  const res = await fetch(`${API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // Important: opt out of Next.js's fetch cache so we always get fresh data.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    return <p>API error: {body.detail ?? "Unknown error"}</p>;
  }

  const user = await res.json();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">Server Component (Node.js Fetch)</h2>
      
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
          <span className="text-sm font-medium text-slate-900">{user.first_name} {user.last_name}</span>
        </div>
        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <span className="text-sm font-medium text-slate-900">{user.email}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-slate-500">Clerk ID</span>
          <span className="truncate text-xs font-mono text-slate-600">{user.id}</span>
        </div>
      </div>
    </div>
  );
}
