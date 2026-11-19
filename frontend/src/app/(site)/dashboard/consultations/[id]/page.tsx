"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pill,
  Stethoscope,
  FileDown,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Share2,
  Copy,
  Check,
  FileAudio,
  FileText,
} from "lucide-react";
import { useConsultation } from "@/features/consultations/api/useConsultation";
import { useConsultationAudio } from "@/features/consultations/api/useConsultationAudio";
import {
  useGeneratePrescription,
  usePrescription,
} from "@/features/consultations/api/usePrescription";
import {
  useUpdateConsultation,
  useApproveConsultation,
  ConsultationUpdatePayload,
} from "@/features/consultations/api/useUpdateConsultation";
import { ClinicalAudioPlayer } from "@/features/consultations/components/ClinicalAudioPlayer";
import { SoapNoteEditor } from "@/features/consultations/components/SoapNoteEditor";
import { DrugInteractionBanner } from "@/features/consultations/components/DrugInteractionBanner";
import { ReviewStatusBar } from "@/components/clinical/ReviewStatusBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import type { Diagnosis, Medication } from "@/features/consultations/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type EditDiag = NonNullable<ConsultationUpdatePayload["diagnoses"]>[0];
type EditMed = NonNullable<ConsultationUpdatePayload["medications"]>[0];

export default function ConsultationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation, isLoading, isError, error, refetch } = useConsultation(id);
  const { data: audioData } = useConsultationAudio(
    consultation?.audio_s3_key ? id : null
  );
  const { data: prescription, refetch: refetchPrescription } = usePrescription(
    consultation?.status === "COMPLETE" ? id : null
  );

  const generateMutation = useGeneratePrescription();
  const updateMutation = useUpdateConsultation(id);
  const approveMutation = useApproveConsultation(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCriticalAcked, setIsCriticalAcked] = useState(false);
  const [editData, setEditData] = useState<ConsultationUpdatePayload | null>(null);

  const hasCriticalInteractions =
    consultation?.interactions?.some(
      (i) => i.severity === "SEVERE" || i.severity === "CRITICAL"
    ) ?? false;

  const criticalAlertCount =
    consultation?.interactions?.filter(
      (i) => i.severity === "SEVERE" || i.severity === "CRITICAL"
    ).length ?? 0;

  const handleEditStart = () => {
    setEditData({
      soap_note: consultation?.soap_note
        ? {
            subjective: consultation.soap_note.subjective || "",
            objective: consultation.soap_note.objective || "",
            assessment: consultation.soap_note.assessment || "",
            plan: consultation.soap_note.plan || "",
          }
        : { subjective: "", objective: "", assessment: "", plan: "" },
      medications: consultation?.medications
        ? [...consultation.medications]
        : [],
      diagnoses: consultation?.diagnoses ? [...consultation.diagnoses] : [],
    });
    setIsEditing(true);
  };

  const handleGeneratePrescription = async () => {
    try {
      await generateMutation.mutateAsync(id);
      refetchPrescription();
      toast.success("Prescription PDF generated successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate prescription.";
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    try {
      await updateMutation.mutateAsync({
        soap_note: editData.soap_note,
        medications: editData.medications,
        diagnoses: editData.diagnoses,
      });
      setIsEditing(false);
      toast.success("Clinical documentation updated successfully.");
    } catch {
      // Toast fired by mutation onError
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-40 bg-card border border-border rounded-[var(--radius-md)] p-4" />
            <div className="h-64 bg-card border border-border rounded-[var(--radius-md)] p-4" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="h-24 bg-card border border-border rounded-[var(--radius-md)] p-4" />
            <div className="h-80 bg-card border border-border rounded-[var(--radius-md)] p-4" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !consultation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Consultation Record Not Found"
          message={
            isError
              ? error instanceof Error
                ? error.message
                : "Failed to load clinical encounter."
              : "The requested consultation could not be located in this clinical workspace."
          }
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Return to Dashboard Roster
          </Button>
        </div>
      </div>
    );
  }

  const { soap_note, medications, diagnoses, interactions } = consultation;
  const isVerified =
    consultation.status === "COMPLETE" || Boolean(soap_note?.edited_by_doctor);

  const canApprove =
    consultation.status === "AWAITING_REVIEW" &&
    (!hasCriticalInteractions || isCriticalAcked);

  // Verification tally (4 SOAP sections + diagnoses + medications)
  const totalReviewItems = 6;
  const verifiedReviewItems = isVerified ? 6 : isEditing ? 5 : 4;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Top Encounter Navigation & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
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
                  Clinical Encounter Review
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  ENC-{id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Visit on {formatDate(consultation.created_at)}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {consultation.status === "COMPLETE" ? (
              <Badge variant="success" size="md" dot>
                Complete & Signed
              </Badge>
            ) : consultation.status === "AWAITING_REVIEW" ? (
              <Badge variant="warning" size="md" dot>
                Awaiting Clinician Review
              </Badge>
            ) : (
              <Badge variant="default" size="md">
                {consultation.status}
              </Badge>
            )}

            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditStart}
                className="text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit Notes
              </Button>
            )}

            {isEditing && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                  className="text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save Draft
                </Button>
              </div>
            )}

            {consultation.status === "COMPLETE" && !prescription?.url && (
              <Button
                size="sm"
                onClick={handleGeneratePrescription}
                isLoading={generateMutation.isPending}
                className="text-xs"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Generate Prescription
              </Button>
            )}

            {consultation.status === "COMPLETE" && prescription?.url && (
              <div className="flex items-center gap-1.5">
                <a
                  href={prescription.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 text-xs font-semibold transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  View PDF
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share Rx
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Split-Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane (40%, 5 cols): Audio Player + Verbatim Transcript + Diagnoses */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Audio Recording & Waveform */}
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-primary" />
                  Clinical Audio Recording
                </h2>
                {consultation.duration_seconds && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {Math.floor(consultation.duration_seconds / 60)}m{" "}
                    {consultation.duration_seconds % 60}s
                  </span>
                )}
              </div>

              {audioData?.url ? (
                <ClinicalAudioPlayer audioUrl={audioData.url} />
              ) : (
                <div className="p-3 rounded-[var(--radius-sm)] bg-muted/40 border border-border text-xs text-muted-foreground font-mono text-center">
                  Audio recording not available for this encounter.
                </div>
              )}
            </div>

            {/* Verbatim Audio Transcript */}
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Verbatim Audio Transcript
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Nova-2 ASR
                </span>
              </div>
              <div
                className="max-h-[360px] overflow-y-auto p-3 rounded-[var(--radius-sm)] bg-muted/20 border border-border/60 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans"
                tabIndex={0}
                aria-label="Encounter audio transcript"
              >
                {soap_note?.raw_transcript || (
                  <span className="italic font-mono text-muted-foreground">
                    No transcript available for this encounter.
                  </span>
                )}
              </div>
            </div>

            {/* Extracted Diagnoses & ICD-10 */}
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  Diagnoses & ICD-10 Codes
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!editData) return;
                      setEditData({
                        ...editData,
                        diagnoses: [
                          ...(editData.diagnoses || []),
                          { icd_code: "", description: "" },
                        ],
                      });
                    }}
                    className="p-1 rounded-[var(--radius-xs)] border border-border bg-muted/60 hover:bg-muted text-xs text-foreground transition-colors"
                    title="Add Diagnosis"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                diagnoses && diagnoses.length > 0 ? (
                  <div className="space-y-2">
                    {diagnoses.map((d: Diagnosis) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-[var(--radius-sm)] border border-border/80 bg-muted/20 flex items-start justify-between gap-2"
                      >
                        <p className="text-xs text-foreground font-medium">
                          {d.description}
                        </p>
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold shrink-0">
                          {d.icd_code || "ICD-10"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-mono">
                    No diagnoses extracted.
                  </p>
                )
              ) : (
                <div className="space-y-2.5">
                  {editData?.diagnoses?.map((d: EditDiag, index: number) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-[var(--radius-sm)] border border-border bg-background relative space-y-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!editData || !editData.diagnoses) return;
                          const newDiags = [...editData.diagnoses];
                          newDiags.splice(index, 1);
                          setEditData({ ...editData, diagnoses: newDiags });
                        }}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove Diagnosis"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input
                        placeholder="ICD Code (e.g. J20.9)"
                        value={d.icd_code || ""}
                        onChange={(e) => {
                          if (!editData || !editData.diagnoses) return;
                          const newDiags = [...editData.diagnoses];
                          newDiags[index] = {
                            ...newDiags[index],
                            icd_code: e.target.value,
                          };
                          setEditData({ ...editData, diagnoses: newDiags });
                        }}
                        className="w-36 h-7 px-2 text-xs font-mono rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        placeholder="Condition description"
                        value={d.description || ""}
                        onChange={(e) => {
                          if (!editData || !editData.diagnoses) return;
                          const newDiags = [...editData.diagnoses];
                          newDiags[index] = {
                            ...newDiags[index],
                            description: e.target.value,
                          };
                          setEditData({ ...editData, diagnoses: newDiags });
                        }}
                        className="w-full h-7 px-2 text-xs rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane (60%, 7 cols): Pharmacological Safety + SOAP Editor + Medications */}
          <div className="lg:col-span-7 space-y-5">
            {/* Pharmacological Safety Alerts Card */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Pharmacological Safety Guardrails
              </h2>
              <DrugInteractionBanner
                interactions={interactions || []}
                onAcknowledgeAll={setIsCriticalAcked}
              />
            </div>

            {/* SOAP Clinical Progress Note */}
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs">
              <SoapNoteEditor
                soapNote={soap_note}
                isEditing={isEditing}
                isVerified={isVerified}
                values={{
                  subjective:
                    (isEditing
                      ? editData?.soap_note?.subjective
                      : soap_note?.subjective) || "",
                  objective:
                    (isEditing
                      ? editData?.soap_note?.objective
                      : soap_note?.objective) || "",
                  assessment:
                    (isEditing
                      ? editData?.soap_note?.assessment
                      : soap_note?.assessment) || "",
                  plan:
                    (isEditing
                      ? editData?.soap_note?.plan
                      : soap_note?.plan) || "",
                }}
                onChange={(field, value) => {
                  if (!editData) return;
                  setEditData({
                    ...editData,
                    soap_note: {
                      ...editData.soap_note,
                      [field]: value,
                    },
                  });
                }}
              />
            </div>

            {/* Prescribed Regimen & Medications */}
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-primary" />
                  Prescribed Regimen & Formulations
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!editData) return;
                      setEditData({
                        ...editData,
                        medications: [
                          ...(editData.medications || []),
                          { name: "", dosage: "", frequency: "", duration: "" },
                        ],
                      });
                    }}
                    className="p-1 rounded-[var(--radius-xs)] border border-border bg-muted/60 hover:bg-muted text-xs text-foreground transition-colors"
                    title="Add Medication"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                medications && medications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {medications.map((m: Medication) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-[var(--radius-sm)] border border-border/80 bg-muted/20 space-y-1"
                      >
                        <p className="text-xs font-bold text-foreground">
                          {m.name}
                        </p>
                        <div className="flex flex-wrap gap-x-2 text-[11px] font-mono text-muted-foreground">
                          {m.dosage && <span>{m.dosage}</span>}
                          {m.frequency && <span>• {m.frequency}</span>}
                          {m.duration && <span>• {m.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-mono">
                    No medications prescribed.
                  </p>
                )
              ) : (
                <div className="space-y-3">
                  {editData?.medications?.map((m: EditMed, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-[var(--radius-sm)] border border-border bg-background relative space-y-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!editData || !editData.medications) return;
                          const newMeds = [...editData.medications];
                          newMeds.splice(index, 1);
                          setEditData({ ...editData, medications: newMeds });
                        }}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove Medication"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input
                        placeholder="Medication Name (e.g. Amoxicillin)"
                        value={m.name || ""}
                        onChange={(e) => {
                          if (!editData || !editData.medications) return;
                          const newMeds = [...editData.medications];
                          newMeds[index] = {
                            ...newMeds[index],
                            name: e.target.value,
                          };
                          setEditData({ ...editData, medications: newMeds });
                        }}
                        className="w-full h-7 px-2 text-xs font-bold rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          placeholder="Dosage (500mg)"
                          value={m.dosage || ""}
                          onChange={(e) => {
                            if (!editData || !editData.medications) return;
                            const newMeds = [...editData.medications];
                            newMeds[index] = {
                              ...newMeds[index],
                              dosage: e.target.value,
                            };
                            setEditData({ ...editData, medications: newMeds });
                          }}
                          className="h-7 px-2 text-xs font-mono rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          placeholder="Frequency (TID)"
                          value={m.frequency || ""}
                          onChange={(e) => {
                            if (!editData || !editData.medications) return;
                            const newMeds = [...editData.medications];
                            newMeds[index] = {
                              ...newMeds[index],
                              frequency: e.target.value,
                            };
                            setEditData({ ...editData, medications: newMeds });
                          }}
                          className="h-7 px-2 text-xs font-mono rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          placeholder="Duration (7 days)"
                          value={m.duration || ""}
                          onChange={(e) => {
                            if (!editData || !editData.medications) return;
                            const newMeds = [...editData.medications];
                            newMeds[index] = {
                              ...newMeds[index],
                              duration: e.target.value,
                            };
                            setEditData({ ...editData, medications: newMeds });
                          }}
                          className="h-7 px-2 text-xs font-mono rounded-[var(--radius-xs)] border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Docked Review Status Bar */}
      <ReviewStatusBar
        totalItems={totalReviewItems}
        verifiedItems={verifiedReviewItems}
        criticalAlertCount={criticalAlertCount}
        criticalAlertsAcknowledged={isCriticalAcked}
        canApprove={canApprove}
        isApproving={approveMutation.isPending}
        onApprove={() => approveMutation.mutate()}
        onSaveDraft={handleSave}
      />

      {/* Share Prescription Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-[var(--radius-lg)] shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-sm text-foreground">
                Share Encrypted Prescription
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-[var(--radius-xs)] hover:bg-muted transition-colors"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-mono">
              Signed HMAC-SHA256 link valid for 7 days. Grants read-only patient access:
            </p>

            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-8 px-2.5 rounded-[var(--radius-sm)] border border-input bg-muted/40 text-xs text-foreground font-mono truncate flex items-center select-all"
                title={prescription?.share_url || ""}
              >
                {prescription?.share_url || `Generating signed token...`}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const linkToCopy =
                    prescription?.share_url ||
                    `${window.location.origin}/consultations/public/${id}/prescription`;
                  navigator.clipboard.writeText(linkToCopy);
                  toast.success("Prescription link copied to clipboard.");
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
