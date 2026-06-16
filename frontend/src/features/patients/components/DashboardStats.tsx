"use client";

import { Users, TrendingUp, FileText, Activity } from "lucide-react";
import { usePatients } from "../api/usePatients";
import { StatCard, StatCardSkeleton } from "./StatCard";

/**
 * DashboardStats
 *
 * Renders the 4-card stats row on the dashboard.
 * Owns its own data fetching (usePatients) and shows skeleton cards
 * while loading — the rest of the page renders immediately.
 */
export function DashboardStats() {
  const { data: patients, isLoading } = usePatients();

  const thisMonth = (patients ?? []).filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

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
        value={patients?.length ?? 0}
        sub="Under your care"
        color="bg-teal-50 text-teal-600"
      />
      <StatCard
        icon={TrendingUp}
        label="Added This Month"
        value={thisMonth}
        sub="New registrations"
        color="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={FileText}
        label="Consultations"
        value="—"
        sub="Coming soon"
        color="bg-violet-50 text-violet-600"
      />
      <StatCard
        icon={Activity}
        label="SOAP Notes"
        value="—"
        sub="AI-generated"
        color="bg-amber-50 text-amber-600"
      />
    </section>
  );
}
