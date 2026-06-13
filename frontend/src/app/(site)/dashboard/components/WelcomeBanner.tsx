"use client";

import { useUser } from "@clerk/nextjs";
import { useDoctor } from "@/features/doctor/api/useDoctor";
import { SkeletonBox, SkeletonCircle } from "@/components/ui/Skeleton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WelcomeBannerSkeleton() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-40" />
        <SkeletonBox className="h-8 w-56" />
        <SkeletonBox className="h-3.5 w-48" />
      </div>
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
        <SkeletonCircle className="w-10 h-10" />
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>
    </section>
  );
}

// ─── WelcomeBanner ────────────────────────────────────────────────────────────

/**
 * Greeting + date row at the top of the dashboard.
 * Fetches doctor profile for clinic name and specialty badge.
 * Shows skeleton while the doctor profile loads.
 */
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
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-teal-600 mb-0.5">
          {greeting}, {doctorName}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {doctor?.clinic_name ? `${doctor.clinic_name} Dashboard` : "Your Dashboard"}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {doctor && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center">
            {user?.firstName?.[0]?.toUpperCase() ?? "D"}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {doctor.speciality ?? "General Practice"}
            </p>
            <p className="text-xs text-slate-500">
              {doctor.years_of_experience != null
                ? `${doctor.years_of_experience} yrs experience`
                : ""}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
