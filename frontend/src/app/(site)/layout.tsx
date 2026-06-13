"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// ─── Route-agnostic loading skeleton ─────────────────────────────────────────
//
// This shows while Clerk initializes (~200-400ms on every page load).
// Clerk is a client-side auth library — it must run JavaScript and verify
// the session cookie before it knows who the user is. This delay is inherent
// and cannot be avoided. This skeleton prevents the black flash that occurred
// when the layout returned null during that window.
//
// IMPORTANT: This skeleton is intentionally minimal and route-agnostic.
// It only renders the sticky navbar (which is shared by ALL routes under
// (site)/). The page content area is left as the bg-slate-50 background
// because each page already renders its own component-level skeletons once
// it mounts (StatCardSkeleton, PatientListSkeleton, etc.).
//
// Do NOT put dashboard-specific content here — this layout wraps:
//   /dashboard, /dashboard/patients/[id], and any future routes.

function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar — the one element shared by every route under (site)/ */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 rounded-full bg-slate-200 animate-pulse hidden sm:block" />
            <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
      {/* Content: just the background. Each page renders its own skeleton. */}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          router.replace("/onboarding");
          return;
        }

        if (res.ok) {
          const doctor = await res.json();
          if (!doctor.is_onboarded) {
            router.replace("/onboarding");
          }
        }
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
      }
    };

    checkOnboarding();
  }, [isLoaded, user, router, getToken]);

  // Show a minimal route-agnostic skeleton while Clerk verifies the session.
  // This is unavoidable with client-side auth (~200-400ms on every reload).
  // The skeleton only shows the shared navbar — each page handles its own
  // content-level skeleton independently.
  if (!isLoaded || !user) return <AuthLoadingSkeleton />;

  return <>{children}</>;
}
