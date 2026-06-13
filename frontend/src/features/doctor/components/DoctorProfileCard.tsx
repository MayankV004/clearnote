"use client";

import { Stethoscope, Activity } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDoctor } from "../api/useDoctor";
import { SkeletonBox, SkeletonCircle } from "@/components/ui/Skeleton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DoctorProfileCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <SkeletonBox className="h-3 w-20 mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle className="w-12 h-12 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-36" />
        <SkeletonBox className="h-4 w-28" />
      </div>
    </div>
  );
}

// ─── DoctorProfileCard ────────────────────────────────────────────────────────

/**
 * Shows the authenticated doctor's profile in the dashboard sidebar.
 * Fetches its own data via useDoctor() — renders a skeleton while loading.
 */
export function DoctorProfileCard() {
  const { user } = useUser();
  const { data: doctor, isLoading } = useDoctor();

  if (isLoading) return <DoctorProfileCardSkeleton />;
  if (!doctor) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
        Your Profile
      </h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center">
          {user?.firstName?.[0]?.toUpperCase() ?? "D"}
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">{doctor.name}</p>
          <p className="text-xs text-slate-500">{doctor.speciality ?? "General Practice"}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {doctor.clinic_name && (
          <div className="flex items-center gap-2 text-slate-600">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {doctor.clinic_name}
          </div>
        )}
        {doctor.years_of_experience != null && (
          <div className="flex items-center gap-2 text-slate-600">
            <Activity className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {doctor.years_of_experience} years experience
          </div>
        )}
      </div>
    </div>
  );
}
