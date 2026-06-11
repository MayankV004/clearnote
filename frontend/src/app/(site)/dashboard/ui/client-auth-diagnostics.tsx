"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export function ClientAuthDiagnostics() {
  const auth = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();

  const clientChecks = [
    { label: "useUser.isLoaded", value: String(isLoaded) },
    { label: "useUser.isSignedIn", value: String(isSignedIn) },
    { label: "useAuth.userId", value: auth.userId ?? "missing" },
    { label: "useAuth.sessionId", value: auth.sessionId ?? "missing" },
  ];

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Client-Side Checks</h2>
      <p className="mt-1 text-sm text-slate-600">
        Values below are read from Clerk React hooks in the browser.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {clientChecks.map((check) => {
          const passes = check.value !== "missing" && check.value !== "false";

          return (
            <div
              key={check.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {check.label}
              </p>
              <p className="mt-1 break-all font-mono text-sm">{check.value}</p>
              <p
                className={`mt-2 text-xs font-semibold ${
                  passes ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {passes ? "PASS" : "CHECK"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          useUser() Snapshot
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(
  {
    id: user?.id ?? null,
    fullName: user?.fullName ?? null,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user?.imageUrl ?? null,
  },
  null,
  2,
)}
        </pre>
      </div>
    </section>
  );
}
