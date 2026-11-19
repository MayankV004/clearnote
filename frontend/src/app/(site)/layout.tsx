"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";

// ─── Route-agnostic loading skeleton ─────────────────────────────────────────
//
// This shows while Clerk initializes (~200-400ms on every page load).
// Clerk is a client-side auth library — it must run JavaScript and verify
// the session cookie before it knows who the user is. This skeleton prevents
// the black or unstyled flash during that window.
//
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar skeleton matching AppShell dimensions */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded-[var(--radius-xs)] bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-48 rounded-[var(--radius-sm)] bg-muted animate-pulse hidden md:block" />
            <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
          </div>
        </div>
      </div>
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

        if (res.status === 401) {
          router.replace("/sign-in");
          return;
        }

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

  if (!isLoaded || !user) return <AuthLoadingSkeleton />;

  return <AppShell>{children}</AppShell>;
}
