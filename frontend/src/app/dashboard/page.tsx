import { UserButton } from "@clerk/nextjs";
import ProtectedClientExample from "./examples/ProtectedClientExample";
import ProtectedServerExample from "./examples/ProtectedServerExample";

export default async function Dashboard() {
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
          <h2 className="mb-4 text-xl font-semibold">FastAPI Integration Examples</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ProtectedClientExample />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ProtectedServerExample />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}