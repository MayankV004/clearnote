"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { usePatient } from "@/features/patients/api/usePatient";
import { ConsultationList } from "@/features/consultations/components/ConsultationList";
import { AudioRecorderModal } from "@/features/consultations/components/AudioRecorderModal";
import { formatDate, calculateAge, getInitials } from "@/lib/utils";
import { useState } from "react";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-teal-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  const { data: patient, isLoading, isError, error } = usePatient(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (isError || !patient) {
    const message = isError
      ? (error instanceof Error ? error.message : "Failed to load patient.")
      : "Patient not found.";
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{message}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-teal-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initials = getInitials(patient.name);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-500/30">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium">Patient Profile</p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{patient.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRecordingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-200 bg-teal-50 hover:bg-teal-100 text-sm font-semibold text-teal-700 transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              Start Consultation
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column: Identity Card ───────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Patient since {formatDate(patient.created_at)}
              </p>

              {patient.consent_given_at ? (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Consent Given
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  No Consent Recorded
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                Contact &amp; Details
              </h3>
              <InfoCard icon={Phone} label="Phone" value={patient.phone ?? "—"} />
              <InfoCard icon={Mail} label="Email" value={patient.email ?? "—"} />
              <InfoCard icon={Calendar} label="Date of Birth" value={formatDate(patient.dob)} />
              <InfoCard icon={User} label="Age" value={calculateAge(patient.dob)} />
              <InfoCard icon={Clock} label="Last Updated" value={formatDate(patient.updated_at)} />
            </div>
          </div>

          {/* ── Right Column: Activity & Consultations ──────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation History */}
            <ConsultationList patientId={id} />

            {/* Consent Details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Consent Record</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon={FileText}
                  label="Consent Given At"
                  value={formatDate(patient.consent_given_at)}
                />
                <InfoCard
                  icon={FileText}
                  label="Consent Version"
                  value={patient.consent_version ?? "—"}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <AudioRecorderModal 
        isOpen={isRecordingModalOpen} 
        onClose={() => setIsRecordingModalOpen(false)} 
        patientId={id} 
      />
    </div>
  );
}
