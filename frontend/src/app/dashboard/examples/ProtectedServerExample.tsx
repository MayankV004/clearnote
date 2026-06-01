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
    <div>
      <h2>Server Component — /me</h2>
      <p>
        <strong>Name:</strong> {user.first_name} {user.last_name}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Clerk ID:</strong> {user.id}
      </p>
    </div>
  );
}
