"use client";

import Link from "next/link";
import { ChevronRight, Clock, Plus, Users } from "lucide-react";
import { usePatients } from "../api/usePatients";
import { getInitials, timeAgo } from "@/lib/utils";
import { SkeletonBox, SkeletonCircle } from "@/components/ui/Skeleton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PatientRowSkeleton() {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <SkeletonCircle className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-40" />
        <SkeletonBox className="h-3 w-28" />
      </div>
      <SkeletonBox className="h-3 w-12" />
      <SkeletonBox className="h-4 w-4" />
    </li>
  );
}

export function PatientListSkeleton() {
  return (
    <ul className="divide-y divide-cyan-100/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <PatientRowSkeleton key={i} />
      ))}
    </ul>
  );
}

// ─── PatientList ──────────────────────────────────────────────────────────────

interface PatientListProps {
  onAddPatient: () => void;
}

export default function PatientList({ onAddPatient }: PatientListProps) {
  const { data: patients, isLoading, isError, error } = usePatients();

  if (isLoading) return <PatientListSkeleton />;

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-rose-700">Error loading patients</p>
          <p className="mt-1 text-sm text-rose-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
        </div>
      </div>
    );
  }

  const recentPatients = (patients ?? []).slice(0, 8);

  if (recentPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-white/50 flex items-center justify-center mb-5 border border-cyan-100/50 shadow-sm">
          <Users className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="font-bold text-slate-700 text-lg">No patients yet</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">
          Add your first patient to get started with AI-powered consultations and notes.
        </p>
        <button
          onClick={onAddPatient}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-teal text-white text-sm font-semibold hover:from-cyan-500 hover:to-green-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add First Patient
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-cyan-100/50">
      {recentPatients.map((patient) => (
        <li key={patient.id}>
          <Link
            href={`/dashboard/patients/${patient.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-white/30 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
              {getInitials(patient.name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                {patient.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {[patient.phone, patient.email].filter(Boolean).join(" · ") ||
                  "No contact info"}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(patient.created_at)}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-cyan-300 group-hover:text-cyan-600 transition-colors flex-shrink-0 group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
