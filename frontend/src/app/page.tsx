import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-3xl font-bold">Clerk Setup Test Page</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use these links to verify sign-in, sign-up, and protected route access.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-slate-600 px-4 py-2 font-medium hover:bg-slate-800"
          >
            Sign Up
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-600 px-4 py-2 font-medium hover:bg-slate-800"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}