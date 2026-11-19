"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { useDoctor } from "@/features/doctor/api/useDoctor";

// Route-agnostic loading skeleton while Clerk initializes on cold start
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar placeholder */}
      <div className="hidden lg:flex w-64 flex-col border-r border-border bg-card/60 p-4 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
          <div className="h-4 w-28 rounded-[var(--radius-xs)] bg-muted animate-pulse" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-8 w-full rounded-[var(--radius-sm)] bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-[var(--radius-sm)] bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-[var(--radius-sm)] bg-muted animate-pulse" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 w-64 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 rounded-[var(--radius-md)] bg-muted/60 animate-pulse" />
          <div className="h-24 rounded-[var(--radius-md)] bg-muted/60 animate-pulse" />
          <div className="h-24 rounded-[var(--radius-md)] bg-muted/60 animate-pulse" />
          <div className="h-24 rounded-[var(--radius-md)] bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Use cached doctor profile with 10-minute staleTime instead of redundant raw network calls
  const { data: doctor, error: doctorError } = useDoctor();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    // Check doctor onboarding state from cached query
    if (doctor && !doctor.is_onboarded) {
      router.replace("/onboarding");
    } else if (doctorError && typeof doctorError === "object" && "status" in doctorError && (doctorError as { status: number }).status === 404) {
      router.replace("/onboarding");
    }
  }, [isLoaded, user, doctor, doctorError, router]);

  if (!isLoaded || !user) {
    return <AuthLoadingSkeleton />;
  }

  return <AppShell>{children}</AppShell>;
}
