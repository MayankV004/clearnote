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
    <ul className="divide-y divide-slate-100">
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
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-700">No patients yet</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-xs">
          Add your first patient to get started with consultations and notes.
        </p>
        <button
          onClick={onAddPatient}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add First Patient
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {recentPatients.map((patient) => (
        <li key={patient.id}>
          <Link
            href={`/dashboard/patients/${patient.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
              {getInitials(patient.name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                {patient.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {[patient.phone, patient.email].filter(Boolean).join(" · ") ||
                  "No contact info"}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {timeAgo(patient.created_at)}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
