"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useDoctor } from "@/features/doctor/api/useDoctor";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Stethoscope } from "lucide-react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WelcomeBannerSkeleton() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="flex items-center gap-3 bg-card border border-border rounded-[var(--radius-md)] px-4 py-2.5 shadow-xs">
        <Skeleton className="w-9 h-9 rounded-[var(--radius-sm)]" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </section>
  );
}

// ─── WelcomeBanner ────────────────────────────────────────────────────────────

export function WelcomeBanner() {
  const { user, isLoaded } = useUser();
  const { data: doctor, isLoading } = useDoctor();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const doctorName =
    isLoaded && user
      ? `Dr. ${user.lastName || user.firstName || "Doctor"}`
      : "Doctor";

  if (isLoading) return <WelcomeBannerSkeleton />;

  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
            {greeting}, {doctorName}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {doctor?.clinic_name ? doctor.clinic_name : "Clinical Overview"}
        </h1>
      </div>

      {doctor && (
        <div className="flex items-center gap-3 bg-card border border-border rounded-[var(--radius-md)] px-3.5 py-2 shadow-xs">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">
                {doctor.speciality ?? "General Practice"}
              </span>
              <Badge variant="primary" size="sm">Active</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {doctor.license_no ? `Lic. #${doctor.license_no}` : "Verified Clinician"}
              {doctor.years_of_experience != null
                ? ` • ${doctor.years_of_experience}y exp`
                : ""}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
