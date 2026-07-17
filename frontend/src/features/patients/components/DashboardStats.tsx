"use client";

import { Users, TrendingUp, FileText, Activity } from "lucide-react";
import { useDoctorStats } from "@/features/doctor/api/useDoctorStats";
import { StatCard, StatCardSkeleton } from "./StatCard";

/**
 * DashboardStats
 *
 * Renders the 4-card stats row on the dashboard.
 * Owns its own data fetching (useDoctorStats) and shows skeleton cards
 * while loading — the rest of the page renders immediately.
 */
export function DashboardStats() {
  const { data: stats, isLoading } = useDoctorStats();

  if (isLoading) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Patients"
        value={stats?.total_patients ?? 0}
        sub="Under your care"
        color="bg-teal-50 text-teal-600"
      />
      <StatCard
        icon={TrendingUp}
        label="Added This Month"
        value={stats?.new_patients_this_month ?? 0}
        sub="New registrations"
        color="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={FileText}
        label="Consultations"
        value={stats?.total_consultations ?? 0}
        sub="Recorded"
        color="bg-violet-50 text-violet-600"
      />
      <StatCard
        icon={Activity}
        label="SOAP Notes"
        value={stats?.total_soap_notes ?? 0}
        sub="AI-generated"
        color="bg-amber-50 text-amber-600"
      />
    </section>
  );
}
