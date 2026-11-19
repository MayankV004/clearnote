"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Mic,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
} from "lucide-react";
import { usePatients } from "@/features/patients/api/usePatients";
import { useConsultations } from "@/features/consultations/api/useConsultations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import SelectPatientModal from "@/features/patients/components/SelectPatientModal";
import { formatDate, timeAgo } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export default function ConsultationsPage() {
  const router = useRouter();
  const { data: patients, isLoading: isLoadingPatients } = usePatients(1, 50);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AWAITING_REVIEW" | "COMPLETE" | "PROCESSING">("ALL");
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);

  // Set default patient if available
  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Query consultations for the selected patient
  const {
    data: consultations,
    isLoading: isLoadingConsultations,
    isError,
    error,
    refetch,
  } = useConsultations(selectedPatientId);

  const activePatient = patients?.find((p) => p.id === selectedPatientId);

  // Filter consultations
  const filteredConsultations = React.useMemo(() => {
    if (!consultations) return [];
    if (statusFilter === "ALL") return consultations;
    return consultations.filter((c) => c.status === statusFilter);
  }, [consultations, statusFilter]);

  // Global hotkey 'R' to record
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsSelectPatientModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground">SOAPs & Consultations</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Clinical Consultations & SOAP Records
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Audio Synchronized
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review Deepgram Nova-2 verbal dialogue transcripts, inspect discrete SOAP notes, and audit pharmacological safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsSelectPatientModalOpen(true)}
            leftIcon={<Mic className="w-4 h-4" />}
            size="md"
          >
            Start New Recording
          </Button>
        </div>
      </div>

      {/* Patient Selector Bar & Status Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Patient Selection Dropdown */}
        <div className="md:col-span-6 flex items-center gap-2.5">
          <label htmlFor="patient-select" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Select Patient:
          </label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            disabled={isLoadingPatients || !patients?.length}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs transition-colors"
          >
            {isLoadingPatients ? (
              <option>Loading patients...</option>
            ) : !patients || patients.length === 0 ? (
              <option>No registered patients</option>
            ) : (
              patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (MRN: {p.id.slice(0, 8).toUpperCase()})
                </option>
              ))
            )}
          </select>

          {activePatient && (
            <Link
              href={`/dashboard/patients/${activePatient.id}`}
              className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
            >
              View Chart →
            </Link>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="md:col-span-6 flex items-center justify-end gap-1.5 overflow-x-auto">
          {(["ALL", "AWAITING_REVIEW", "COMPLETE", "PROCESSING"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs rounded-[var(--radius-sm)] font-medium transition-colors ${
                statusFilter === filter
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === "ALL"
                ? "All Encounters"
                : filter === "AWAITING_REVIEW"
                ? "Needs Review"
                : filter === "COMPLETE"
                ? "Signed"
                : "Processing"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Encounters List */}
      {isLoadingConsultations ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-[var(--radius-md)] border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load consultations"
          message={error instanceof Error ? error.message : "Unable to retrieve patient encounter records."}
          onRetry={() => refetch()}
        />
      ) : !selectedPatientId ? (
        <EmptyState
          icon={User}
          title="No patient selected"
          description="Register or select a patient to view and manage their consultation history."
          action={{
            label: "Select Patient",
            onClick: () => setIsSelectPatientModalOpen(true),
          }}
        />
      ) : filteredConsultations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={statusFilter === "ALL" ? "No consultations recorded for this patient" : `No encounters with status "${statusFilter}"`}
          description="Begin recording ambient dialogue during an exam to automatically extract structured SOAP notes and detect drug interactions."
          action={{
            label: "Start New Recording",
            onClick: () => setIsSelectPatientModalOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredConsultations.map((c) => {
            const hasCriticalInteraction = c.interactions?.some(
              (i) => i.severity === "CRITICAL" || i.severity === "SEVERE"
            );

            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-border bg-card shadow-xs hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Consultation Info & Badges */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {formatDate(c.created_at)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      • {timeAgo(c.created_at)}
                    </span>

                    {/* Status Badge */}
                    {c.status === "COMPLETE" ? (
                      <Badge variant="outline" size="sm" className="text-teal-700 dark:text-teal-300 border-teal-500/30 bg-teal-500/10 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Signed &amp; Sealed
                      </Badge>
                    ) : c.status === "AWAITING_REVIEW" ? (
                      <Badge variant="outline" size="sm" className="text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10 text-[10px]">
                        Action Required: Sign-off
                      </Badge>
                    ) : c.status === "PROCESSING" ? (
                      <Badge variant="outline" size="sm" className="text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/10 text-[10px] animate-pulse">
                        Transcribing...
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/10 text-[10px]">
                        Transcription Failed
                      </Badge>
                    )}

                    {/* Critical safety flag */}
                    {hasCriticalInteraction && (
                      <Badge variant="destructive" size="sm" className="text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> Critical Harm Intercepted
                      </Badge>
                    )}
                  </div>

                  {/* Summary / Extracted Info */}
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {c.duration_seconds ? formatDuration(c.duration_seconds) : "Live Audio"}
                    </span>
                    {c.diagnoses && c.diagnoses.length > 0 && (
                      <span className="font-mono text-foreground/80">
                        Diagnoses: {c.diagnoses.map((d) => d.icd_code || d.description).join(", ")}
                      </span>
                    )}
                    {c.medications && c.medications.length > 0 && (
                      <span className="font-mono text-primary">
                        {c.medications.length} Prescribed Regimen{c.medications.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Action Button to Open Reviewer */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={c.status === "AWAITING_REVIEW" ? "primary" : "outline"}
                    onClick={() => router.push(`/dashboard/consultations/${c.id}`)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    {c.status === "AWAITING_REVIEW" ? "Review SOAP & Sign" : "View Consultation"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Select Patient Modal for Recording */}
      <SelectPatientModal
        isOpen={isSelectPatientModalOpen}
        onClose={() => setIsSelectPatientModalOpen(false)}
      />
    </div>
  );
}
