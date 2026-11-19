"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/AppShell";
import { QuickActions } from "@/app/(site)/dashboard/components/QuickActions";
import { StatCard } from "@/features/patients/components/StatCard";
import { FileText, CheckCircle2, Users, TrendingUp, Stethoscope, ShieldCheck, MapPin, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import PatientList from "@/features/patients/components/PatientList";
import CreatePatientModal from "@/features/patients/components/CreatePatientModal";
import SelectPatientModal from "@/features/patients/components/SelectPatientModal";

const mockPatients = [
  {
    id: "pat-849201",
    name: "John Doe",
    email: "john.doe@hospital.org",
    phone: "+1 (555) 234-5678",
    dob: "1980-05-15",
    age: 44,
    height: "178 cm",
    weight: "74 kg",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    consent_given_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    consent_version: "v2.1",
  },
  {
    id: "pat-723104",
    name: "Jane Smith",
    email: "jane.smith@med.org",
    phone: "+1 (555) 345-6789",
    dob: "1988-11-20",
    age: 36,
    height: "165 cm",
    weight: "62 kg",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    consent_given_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    consent_version: "v2.1",
  },
  {
    id: "pat-194028",
    name: "Robert Chen",
    email: "robert.chen@health.org",
    phone: "+1 (555) 456-7890",
    dob: "1962-03-08",
    age: 62,
    height: "172 cm",
    weight: "80 kg",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    consent_given_at: null,
    consent_version: null,
  },
  {
    id: "pat-552910",
    name: "Maria Garcia",
    email: "maria.garcia@clinic.org",
    phone: "+1 (555) 567-8901",
    dob: "1995-07-22",
    age: 29,
    height: "160 cm",
    weight: "58 kg",
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    consent_given_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    consent_version: "v2.1",
  },
  {
    id: "pat-338291",
    name: "Arthur Pendelton",
    email: "arthur.p@provider.com",
    phone: "+1 (555) 678-9012",
    dob: "1953-09-14",
    age: 71,
    height: "182 cm",
    weight: "88 kg",
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    consent_given_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    consent_version: "v2.0",
  },
];

const mockDoctor = {
  id: "doc-1",
  name: "Dr. Sarah Jenkins, MD",
  email: "dr.jenkins@mountsinai.org",
  speciality: "Internal Medicine",
  license_no: "MED-NY-849201",
  clinic_name: "Mount Sinai West Outpatient Clinic",
  clinic_address: "1000 10th Ave, New York, NY 10019",
  clinic_phone: "(555) 234-5678",
  years_of_experience: 14,
  bio: "Attending Internist specializing in polypharmacy management and cardiovascular risk reduction.",
  is_onboarded: true,
};

const mockStats = {
  total_patients: 148,
  new_patients_this_month: 14,
  total_consultations: 214,
  total_soap_notes: 198,
};

function createMockQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
      },
    },
  });

  queryClient.setQueryData(["patients", 1, 10], mockPatients);
  queryClient.setQueryData(["patients", 1, 8], mockPatients);
  queryClient.setQueryData(["patients"], mockPatients);
  queryClient.setQueryData(["doctor"], mockDoctor);
  queryClient.setQueryData(["doctor", "stats"], mockStats);

  return queryClient;
}

export default function DevDashboardPage() {
  const [queryClient] = useState(() => createMockQueryClient());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        onAddPatient={() => setIsModalOpen(true)}
        onStartConsultation={() => setIsSelectPatientModalOpen(true)}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Welcome Header */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
                  Good morning, Dr. Sarah Jenkins
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-mono">
                  Thursday, Nov 20, 2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mount Sinai West Outpatient Clinic
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-card border border-border rounded-[var(--radius-md)] px-3.5 py-2 shadow-xs">
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    Internal Medicine
                  </span>
                  <Badge variant="primary" size="sm">Active</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Lic. #MED-NY-849201 • 14y exp
                </p>
              </div>
            </div>
          </section>

          {/* 4-Card Daily Clinical Overview */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Daily clinical metrics">
            <StatCard
              icon={FileText}
              label="Consultations"
              value={mockStats.total_consultations}
              sub="Total encounters documented"
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              icon={CheckCircle2}
              label="Signed SOAP Notes"
              value={mockStats.total_soap_notes}
              sub="Clinician approved & verified"
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={Users}
              label="Active Patients"
              value={mockStats.total_patients}
              sub="Under ongoing care"
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={TrendingUp}
              label="New Registrations"
              value={mockStats.new_patients_this_month}
              sub="Enrolled this month"
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </section>

          {/* Encounters Roster + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main 2/3 Column: Patient Roster */}
            <section className="lg:col-span-2 space-y-3" aria-label="Patient Encounters">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Patient Encounters & Roster
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    Active charts, visit histories, and documentation status
                  </p>
                </div>
              </div>

              <PatientList
                onAddPatient={() => setIsModalOpen(true)}
                onSelectPatient={(p) => alert(`Selected ${p.name}`)}
              />
            </section>

            {/* Sidebar 1/3 Column */}
            <aside className="space-y-6" aria-label="Clinical Quick Actions & Profile">
              <QuickActions
                onAddPatient={() => setIsModalOpen(true)}
                onSelectPatient={() => setIsSelectPatientModalOpen(true)}
              />

              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    Attending Clinician
                  </h3>
                  <Badge variant="primary" size="sm" dot>
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={mockDoctor.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-xs truncate">
                      {mockDoctor.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {mockDoctor.speciality}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-border/60 text-muted-foreground">
                  <div className="flex items-center gap-2 truncate">
                    <Stethoscope className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{mockDoctor.clinic_name}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{mockDoctor.clinic_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span>{mockDoctor.clinic_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>License: {mockDoctor.license_no}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Modals */}
          <CreatePatientModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => setIsModalOpen(false)}
          />
          <SelectPatientModal
            isOpen={isSelectPatientModalOpen}
            onClose={() => setIsSelectPatientModalOpen(false)}
          />
        </div>
      </AppShell>
    </QueryClientProvider>
  );
}
