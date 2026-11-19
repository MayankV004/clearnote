"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/AppShell";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Stethoscope,
  Pencil,
  ShieldCheck,
  Ruler,
  Activity,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import UpdatePatientModal from "@/features/patients/components/UpdatePatientModal";
import { AudioRecorderModal } from "@/features/consultations/components/AudioRecorderModal";

const mockPatient = {
  id: "pat-849201",
  name: "John Doe",
  email: "john.doe@hospital.org",
  phone: "+1 (555) 234-5678",
  dob: "1980-05-15",
  age: 44,
  height: "178 cm",
  weight: "74 kg",
  created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  consent_given_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  consent_version: "v2.1",
};

const mockConsultations = [
  {
    id: "c-1",
    patient_id: "pat-849201",
    doctor_id: "doc-1",
    status: "COMPLETE",
    duration_seconds: 510,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    audio_s3_key: "audio/c-1.webm",
  },
  {
    id: "c-2",
    patient_id: "pat-849201",
    doctor_id: "doc-1",
    status: "COMPLETE",
    duration_seconds: 420,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    audio_s3_key: "audio/c-2.webm",
  },
];

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-mono text-foreground font-semibold text-right truncate max-w-[180px]">
        {value}
      </span>
    </div>
  );
}

export default function DevPatientProfilePage() {
  const [queryClient] = useState(() => new QueryClient());
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-1.5 rounded-[var(--radius-xs)] border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Return to Clinical Roster"
                aria-label="Back to clinical roster"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Electronic Health Record
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    MRN: PAT-849201
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {mockPatient.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateModalOpen(true)}
                className="text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Edit Chart
              </Button>
              <Button
                size="sm"
                onClick={() => setIsRecordingModalOpen(true)}
                className="text-xs"
              >
                <Stethoscope className="w-3.5 h-3.5 mr-1" />
                Start Consultation
              </Button>
            </div>
          </div>

          {/* Main Grid: Identity Column (1/3) + Activity Column (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Demographics & Identity */}
            <div className="space-y-6">
              {/* Identity Card */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 shadow-xs flex flex-col items-center text-center">
                <Avatar name={mockPatient.name} size="xl" />
                <h2 className="text-base font-bold text-foreground mt-3">{mockPatient.name}</h2>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Patient since 20 October 2026
                </p>

                {/* Consent Status */}
                <div className="mt-4 w-full pt-3 border-t border-border/60">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>HIPAA Recording Consent Verified</span>
                  </div>
                </div>
              </div>

              {/* Demographic & Contact Details */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono mb-2">
                  Demographic &amp; Clinical Vitals
                </h3>
                <InfoRow icon={Phone} label="Phone" value={mockPatient.phone} />
                <InfoRow icon={Mail} label="Email" value={mockPatient.email} />
                <InfoRow icon={Calendar} label="Date of Birth" value="15 May 1980" />
                <InfoRow icon={User} label="Age" value="44 yrs" />
                <InfoRow icon={Ruler} label="Height" value={mockPatient.height} />
                <InfoRow icon={Activity} label="Weight" value={mockPatient.weight} />
                <InfoRow icon={Clock} label="Last Updated" value="Today, 10:15 AM" />
              </div>

              {/* Consent Audit Card */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-2 text-xs">
                <h4 className="font-bold text-foreground font-mono text-[11px] uppercase tracking-wider">
                  Legal Consent Audit
                </h4>
                <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Consent Timestamp:</span>
                    <span className="text-foreground">20 Oct 2026, 09:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Form Version:</span>
                    <span className="text-foreground">v2.1 (Digital Signature)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Retention:</span>
                    <span className="text-foreground">HIPAA 7-Year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (2/3): Consultation History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Clinical Encounter History
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      2 recorded consultations on file
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {mockConsultations.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-[var(--radius-sm)] border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {formatDate(c.created_at)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ENC-{c.id.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            8m 30s duration • Acute bronchitis followup
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="success" size="sm" dot>
                            Approved & Signed
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recording Encounter Modal */}
          <AudioRecorderModal
            isOpen={isRecordingModalOpen}
            onClose={() => setIsRecordingModalOpen(false)}
            patientId="pat-849201"
          />

          {/* Edit Patient Demographics Modal */}
          <UpdatePatientModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            patient={mockPatient}
          />
        </div>
      </AppShell>
    </QueryClientProvider>
  );
}
