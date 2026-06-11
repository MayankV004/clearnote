"use client";

import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Plus,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  Mic,
  Activity,
} from "lucide-react";
import CreatePatientModal from "./components/CreatePatientModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
}

interface DoctorProfile {
  name: string;
  speciality: string | null;
  clinic_name: string | null;
  years_of_experience: number | null;
  is_onboarded: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get today's greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const fetchData = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [patientsRes, doctorRes] = await Promise.all([
        fetch(`${API}/patients/`, { headers }),
        fetch(`${API}/doctors/me`, { headers }),
      ]);

      if (patientsRes.ok) setPatients(await patientsRes.json());
      if (doctorRes.ok) setDoctor(await doctorRes.json());
    } catch {
      // silently fail — UI will show empty states
    } finally {
      setLoadingPatients(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) fetchData();
  }, [isLoaded, fetchData, refreshTrigger]);

  // Patients added this month
  const thisMonth = patients.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recentPatients = [...patients].slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30">

      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm shadow-sm">
              CN
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">ClearNote</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled
              title="Coming soon"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              <Mic className="w-4 h-4" />
              Record Session
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Patient
            </button>
            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 border border-slate-200" } }} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* ── Welcome Banner ──────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600 mb-0.5">
              {greeting},{" "}
              {isLoaded && user ? `Dr. ${user.lastName || user.firstName || "Doctor"}` : "Doctor"}
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {doctor?.clinic_name
                ? `${doctor.clinic_name} Dashboard`
                : "Your Dashboard"}
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

          {/* Doctor Identity Badge */}
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

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Patients"
            value={loadingPatients ? "—" : patients.length}
            sub="Under your care"
            color="bg-teal-50 text-teal-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Added This Month"
            value={loadingPatients ? "—" : thisMonth}
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

        {/* ── Main Content Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient List — spans 2 columns */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Patients</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {loadingPatients ? "Loading..." : `${patients.length} total`}
                  </p>
                </div>
                <Link
                  href="#"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingPatients ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700">No patients yet</h3>
                  <p className="mt-1 text-sm text-slate-400 max-w-xs">
                    Add your first patient to get started with consultations and notes.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add First Patient
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentPatients.map((patient) => (
                    <li key={patient.id}>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {getInitials(patient.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                            {patient.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {[patient.phone, patient.email].filter(Boolean).join(" · ") || "No contact info"}
                          </p>
                        </div>

                        {/* Timestamp */}
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
              )}
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="space-y-5">

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold transition-colors text-left"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  Add New Patient
                </button>
                <button
                  disabled
                  title="Coming soon"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium text-left cursor-not-allowed"
                >
                  <Mic className="w-4 h-4 flex-shrink-0" />
                  Record Consultation
                  <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                </button>
                <button
                  disabled
                  title="Coming soon"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium text-left cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  Generate SOAP Note
                  <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                </button>
              </div>
            </div>

            {/* Doctor Profile Card */}
            {doctor && (
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
            )}

            {/* Upcoming Feature Teaser */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-3xl p-5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                AI Consultation Recording
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Record your consultations and let AI generate structured SOAP notes automatically. Coming very soon.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                In development
              </div>
            </div>
          </aside>
        </div>
      </main>

      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((p) => p + 1);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}