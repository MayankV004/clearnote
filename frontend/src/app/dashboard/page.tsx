import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

import { ClientAuthDiagnostics } from "./ui/client-auth-diagnostics";

export default async function Dashboard() {
  const { userId, sessionId, orgId, isAuthenticated } = await auth();
  const user = await currentUser();

  const serverChecks = [
    { label: "isAuthenticated", value: String(isAuthenticated) },
    { label: "userId", value: userId ?? "missing" },
    { label: "sessionId", value: sessionId ?? "missing" },
    { label: "orgId", value: orgId ?? "none" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 md:p-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Clerk Frontend Diagnostics
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Auth Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                This page is protected by Clerk middleware. If you can open this page,
                route protection is active.
              </p>
            </div>
            <UserButton />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Server-Side Checks</h2>
          <p className="mt-1 text-sm text-slate-600">
            Values below come from <code>auth()</code> and <code>currentUser()</code>
            in a server component.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {serverChecks.map((check) => {
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
              currentUser() Snapshot
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(
  {
    id: user?.id ?? null,
    email: user?.emailAddresses[0]?.emailAddress ?? null,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    imageUrl: user?.imageUrl ?? null,
  },
  null,
  2,
)}
            </pre>
          </div>
        </section>

        <ClientAuthDiagnostics />

        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick Test Flow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Open this route in a private window while signed out: `/dashboard`.</li>
            <li>Confirm Clerk redirects you to `/sign-in`.</li>
            <li>Sign in and confirm all checks here show expected values.</li>
            <li>Click the user button and sign out, then revisit `/dashboard`.</li>
          </ol>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Go Home
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Open Sign In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}