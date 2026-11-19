"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  AlertCircle,
  Ruler,
  Activity,
} from "lucide-react";
import { usePatient } from "@/features/patients/api/usePatient";
import { ConsultationList } from "@/features/consultations/components/ConsultationList";
import { AudioRecorderModal } from "@/features/consultations/components/AudioRecorderModal";
import UpdatePatientModal from "@/features/patients/components/UpdatePatientModal";
import { useUpdatePatient } from "@/features/patients/api/useUpdatePatient";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { formatDate, calculateAge } from "@/lib/utils";

// ─── Info Row Sub-component ───────────────────────────────────────────────────

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

// ─── Patient Profile Page ─────────────────────────────────────────────────────

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const { mutateAsync: updatePatient, isPending: isUpdatingConsent } = useUpdatePatient();

  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-card border border-border rounded-[var(--radius-md)] p-6" />
          <div className="lg:col-span-2 h-96 bg-card border border-border rounded-[var(--radius-md)] p-6" />
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Patient Record Not Found"
          message={
            isError
              ? error instanceof Error
                ? error.message
                : "Failed to retrieve electronic medical chart."
              : "No patient matching this clinical identifier could be found."
          }
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Clinical Roster
          </Button>
        </div>
      </div>
    );
  }

  const handleRecordConsent = async () => {
    try {
      await updatePatient({
        patientId: patient.id,
        payload: {
          consent_given_at: new Date().toISOString(),
          consent_version: "v2.1",
        },
      });
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
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
                MRN: {patient.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {patient.name}
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
            <Avatar name={patient.name} size="xl" />
            <h2 className="text-base font-bold text-foreground mt-3">{patient.name}</h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Chart created {formatDate(patient.created_at)}
            </p>

            {/* Consent Status */}
            <div className="mt-4 w-full pt-3 border-t border-border/60">
              {patient.consent_given_at ? (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>HIPAA Recording Consent Verified</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Consent Signature Pending</span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleRecordConsent}
                    isLoading={isUpdatingConsent}
                    className="w-full text-xs"
                  >
                    Record Verbal Consent Now
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Demographic & Contact Details */}
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono mb-2">
              Demographic &amp; Clinical Vitals
            </h3>
            <InfoRow icon={Phone} label="Phone" value={patient.phone ?? "—"} />
            <InfoRow icon={Mail} label="Email" value={patient.email ?? "—"} />
            <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(patient.dob)} />
            <InfoRow
              icon={User}
              label="Age"
              value={patient.age ? `${patient.age} yrs` : calculateAge(patient.dob)}
            />
            {patient.height && <InfoRow icon={Ruler} label="Height" value={patient.height} />}
            {patient.weight && <InfoRow icon={Activity} label="Weight" value={patient.weight} />}
            <InfoRow icon={Clock} label="Last Updated" value={formatDate(patient.updated_at)} />
          </div>

          {/* Consent Audit Card */}
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-2 text-xs">
            <h4 className="font-bold text-foreground font-mono text-[11px] uppercase tracking-wider">
              Legal Consent Audit
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Consent Timestamp:</span>
                <span className="text-foreground">{formatDate(patient.consent_given_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Form Version:</span>
                <span className="text-foreground">{patient.consent_version ?? "None"}</span>
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
          <ConsultationList
            patientId={id}
            onStartConsultation={() => setIsRecordingModalOpen(true)}
          />
        </div>
      </div>

      {/* Recording Encounter Modal */}
      <AudioRecorderModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        patientId={id}
      />

      {/* Edit Patient Demographics Modal */}
      <UpdatePatientModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        patient={patient}
      />
    </div>
  );
}
