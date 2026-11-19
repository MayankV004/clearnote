"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Pill,
  Stethoscope,
  AlertCircle,
  FileDown,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Share2,
  Copy,
  Check,
  FileAudio,
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
import type { Diagnosis, Medication } from "@/features/consultations/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type EditDiag = NonNullable<ConsultationUpdatePayload["diagnoses"]>[0];
type EditMed = NonNullable<ConsultationUpdatePayload["medications"]>[0];

export default function ConsultationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation, isLoading, isError, error } = useConsultation(id);
  const { data: audioData } = useConsultationAudio(
    consultation?.audio_s3_key ? id : null,
  );
  const { data: prescription, refetch: refetchPrescription } = usePrescription(
    consultation?.status === "COMPLETE" ? id : null,
  );

  const generateMutation = useGeneratePrescription();
  const updateMutation = useUpdateConsultation(id);
  const approveMutation = useApproveConsultation(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCriticalAcked, setIsCriticalAcked] = useState(false);
  const [editData, setEditData] = useState<ConsultationUpdatePayload | null>(
    null,
  );

  const hasCriticalInteractions =
    consultation?.interactions?.some(
      (i) => i.severity === "SEVERE" || i.severity === "CRITICAL",
    ) ?? false;

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
      toast.success("Prescription generated successfully!");
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
      toast.success("Clinical note updated successfully.");
    } catch {
      // Toast fired by mutation onError
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (isError || !consultation) {
    const message = isError
      ? error instanceof Error
        ? error.message
        : "Failed to load consultation."
      : "Consultation not found.";
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
        <p className="text-rose-600 font-semibold">{message}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-teal-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { soap_note, medications, diagnoses, interactions } = consultation;
  const isVerified =
    consultation.status === "COMPLETE" ||
    Boolean(soap_note?.edited_by_doctor);

  const canApprove =
    consultation.status === "AWAITING_REVIEW" &&
    (!hasCriticalInteractions || isCriticalAcked);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30">
      {/* Top Bar / Review Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Back to consultations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 font-medium">
                  Clinical Encounter Review
                </p>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-500">
                  {id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {formatDate(consultation.created_at)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                consultation.status === "COMPLETE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : consultation.status === "AWAITING_REVIEW"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {consultation.status === "AWAITING_REVIEW"
                ? "Awaiting Clinician Review"
                : consultation.status}
            </span>

            {(consultation.status === "COMPLETE" ||
              consultation.status === "AWAITING_REVIEW") && (
              <>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold text-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEditStart}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-xs hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Documentation
                    </button>

                    {consultation.status === "AWAITING_REVIEW" && (
                      <button
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending || !canApprove}
                        title={
                          !canApprove
                            ? "Acknowledge critical drug interactions before sign-off"
                            : "Approve SOAP note & unlock prescription"
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve & Sign Off
                      </button>
                    )}
                  </div>
                )}

                {!isEditing &&
                  consultation.status === "COMPLETE" &&
                  (prescription?.url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={prescription.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-50 text-teal-700 rounded-xl font-semibold text-xs hover:bg-teal-100 transition-colors border border-teal-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        View Prescription
                      </a>
                      <button
                        onClick={handleGeneratePrescription}
                        disabled={generateMutation.isPending}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors border border-slate-200 disabled:opacity-50"
                        title="Regenerate prescription with latest edits"
                      >
                        {generateMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Update
                      </button>
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-xs hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGeneratePrescription}
                      disabled={generateMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold text-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {generateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4" />
                      )}
                      Generate Prescription
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Split-Screen Reviewer */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Pane (5 cols): Audio Player + Raw Transcript + Clinical Signals */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Audio Recording & Waveform Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-teal-600" />
                  Clinical Audio Recording
                </h2>
                {consultation.duration_seconds && (
                  <span className="text-xs font-mono text-slate-500">
                    {Math.floor(consultation.duration_seconds / 60)}m{" "}
                    {consultation.duration_seconds % 60}s
                  </span>
                )}
              </div>

              {audioData?.url ? (
                <ClinicalAudioPlayer audioUrl={audioData.url} />
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Audio playback URL not generated or expired.
                </div>
              )}
            </div>

            {/* Verbatim Transcript */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Verbatim Audio Transcript
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Deepgram Nova-2
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {soap_note?.raw_transcript || (
                  <span className="italic text-slate-400">
                    No transcript available for this encounter.
                  </span>
                )}
              </div>
            </div>

            {/* Extracted Diagnoses */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-500" />
                  Diagnoses & ICD Codes
                </h2>
                {isEditing && (
                  <button
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
                    className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                diagnoses && diagnoses.length > 0 ? (
                  <ul className="space-y-2.5">
                    {diagnoses.map((d: Diagnosis) => (
                      <li
                        key={d.id}
                        className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold font-mono">
                            {d.icd_code || "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">
                          {d.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No diagnoses extracted.
                  </p>
                )
              ) : (
                <ul className="space-y-3">
                  {editData?.diagnoses?.map((d: EditDiag, index: number) => (
                    <li
                      key={index}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group"
                    >
                      <button
                        onClick={() => {
                          if (!editData || !editData.diagnoses) return;
                          const newDiags = [...editData.diagnoses];
                          newDiags.splice(index, 1);
                          setEditData({ ...editData, diagnoses: newDiags });
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
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
                        className="w-full mb-2 p-1.5 text-xs font-mono bg-white border border-slate-200 rounded"
                      />
                      <input
                        placeholder="Description"
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
                        className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Pane (7 cols): Drug Interaction Alert + SOAP Note + Medications */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pharmacological Safety Alerts Banner */}
            <DrugInteractionBanner
              interactions={interactions || []}
              onAcknowledgeAll={setIsCriticalAcked}
            />

            {/* Editable SOAP Clinical Note */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
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

            {/* Extracted Prescribed Medications */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-rose-500" />
                  Prescribed Regimen & Dosing
                </h2>
                {isEditing && (
                  <button
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
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                medications && medications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {medications.map((m: Medication) => (
                      <div
                        key={m.id}
                        className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100/60"
                      >
                        <p className="text-xs font-bold text-slate-900 mb-1">
                          {m.name}
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                          {m.dosage && <span>{m.dosage}</span>}
                          {m.frequency && <span>• {m.frequency}</span>}
                          {m.duration && <span>• {m.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No medications prescribed.
                  </p>
                )
              ) : (
                <div className="space-y-3">
                  {editData?.medications?.map((m: EditMed, index: number) => (
                    <div
                      key={index}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 relative group"
                    >
                      <button
                        onClick={() => {
                          if (!editData || !editData.medications) return;
                          const newMeds = [...editData.medications];
                          newMeds.splice(index, 1);
                          setEditData({ ...editData, medications: newMeds });
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input
                        placeholder="Medication Name"
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
                        className="w-full mb-2 p-1.5 pr-8 text-xs font-bold bg-white border border-slate-200 rounded"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          placeholder="Dosage"
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
                          className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                        />
                        <input
                          placeholder="Frequency"
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
                          className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                        />
                        <input
                          placeholder="Duration"
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
                          className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Prescription Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Share Prescription</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-600 mb-4 font-medium">
                Copy unique, tamper-proof prescription link:
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono truncate select-all"
                  title={
                    prescription?.share_url ||
                    `/consultations/public/${id}/prescription`
                  }
                >
                  {prescription?.share_url || `Generating secure link...`}
                </div>
                <button
                  onClick={() => {
                    const linkToCopy =
                      prescription?.share_url ||
                      `${window.location.origin}/consultations/public/${id}/prescription`;
                    navigator.clipboard.writeText(linkToCopy);
                    toast.success("Secure share link copied to clipboard!");
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 ${
                    isCopied
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
