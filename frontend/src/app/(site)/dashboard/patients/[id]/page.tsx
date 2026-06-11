"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
  consent_given_at: string | null;
  consent_version: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateAge(dob: string | null): string {
  if (!dob) return "—";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} years`;
}

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

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !id) return;

    async function fetchPatient() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API}/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          router.replace("/dashboard");
          return;
        }
        if (!res.ok) throw new Error("Failed to load patient data.");
        const data = await res.json();
        setPatient(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [isLoaded, id, getToken, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{error ?? "Patient not found."}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-teal-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-400 cursor-not-allowed"
              title="Coming soon"
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
                Contact & Details
              </h3>
              <InfoCard icon={Phone} label="Phone" value={patient.phone ?? "—"} />
              <InfoCard icon={Mail} label="Email" value={patient.email ?? "—"} />
              <InfoCard icon={Calendar} label="Date of Birth" value={formatDate(patient.dob)} />
              <InfoCard icon={User} label="Age" value={calculateAge(patient.dob)} />
              <InfoCard
                icon={Clock}
                label="Last Updated"
                value={formatDate(patient.updated_at)}
              />
            </div>
          </div>

          {/* ── Right Column: Activity & Consultations ──────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation History Placeholder */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Consultation History</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Past visits and notes</p>
                </div>
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-semibold opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Stethoscope className="w-4 h-4" />
                  New Session
                </button>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-700">No consultations yet</h4>
                <p className="mt-2 text-sm text-slate-400 max-w-sm">
                  Once you record a consultation session with this patient, it will appear here with the AI-generated SOAP note.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-xs font-medium">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Consultation recording — coming soon
                </div>
              </div>
            </div>

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
    </div>
  );
}
