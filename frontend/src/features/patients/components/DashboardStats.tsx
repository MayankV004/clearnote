"use client";

import React from "react";
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { useDoctorStats } from "@/features/doctor/api/useDoctorStats";
import { StatCard, StatCardSkeleton } from "./StatCard";

export function DashboardStats() {
  const { data: stats, isLoading } = useDoctorStats();

  if (isLoading) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Loading clinical metrics">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Daily clinical overview">
      <StatCard
        icon={FileText}
        label="Consultations"
        value={stats?.total_consultations ?? 0}
        sub="Total encounters documented"
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        icon={CheckCircle2}
        label="Signed SOAP Notes"
        value={stats?.total_soap_notes ?? 0}
        sub="Clinician approved & verified"
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        icon={Users}
        label="Active Patients"
        value={stats?.total_patients ?? 0}
        sub="Under ongoing care"
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        icon={TrendingUp}
        label="New Registrations"
        value={stats?.new_patients_this_month ?? 0}
        sub="Enrolled this month"
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
    </section>
  );
}
