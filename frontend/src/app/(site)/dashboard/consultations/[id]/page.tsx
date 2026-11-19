"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Pill,
  Stethoscope,
  AlertCircle,
  FileText,
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
} from "lucide-react";
import { useConsultation } from "@/features/consultations/api/useConsultation";
import {
  useGeneratePrescription,
  usePrescription,
} from "@/features/consultations/api/usePrescription";
import {
  useUpdateConsultation,
  ConsultationUpdatePayload,
} from "@/features/consultations/api/useUpdateConsultation";
import type { Diagnosis, Medication } from "@/features/consultations/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

// Define the exact item types expected in the update payload to avoid 'any'
type EditDiag = NonNullable<ConsultationUpdatePayload["diagnoses"]>[0];
type EditMed = NonNullable<ConsultationUpdatePayload["medications"]>[0];

export default function ConsultationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation, isLoading, isError, error } = useConsultation(id);
  const { data: prescription, refetch: refetchPrescription } = usePrescription(
    consultation?.status === "COMPLETE" ? id : null,
  );

  const generateMutation = useGeneratePrescription();
  const updateMutation = useUpdateConsultation(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [editData, setEditData] = useState<ConsultationUpdatePayload | null>(
    null,
  );

  const handleEditStart = () => {
    setEditData({
      soap_note: consultation?.soap_note
        ? {
            subjective: consultation.soap_note.subjective,
            objective: consultation.soap_note.objective,
            assessment: consultation.soap_note.assessment,
            plan: consultation.soap_note.plan,
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
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to generate prescription.";
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
    } catch {
      // Error toast is already fired by useUpdateConsultation's onError
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
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
        <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-red-500 font-semibold">{message}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-teal-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { soap_note, medications, diagnoses } = consultation;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-screen-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Consultation Review
              </p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {formatDate(consultation.created_at)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wide uppercase border border-emerald-100">
              {consultation.status}
            </span>

            {consultation.status === "COMPLETE" && (
              <>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
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
                  <button
                    onClick={handleEditStart}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-colors border border-indigo-200"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}

                {!isEditing &&
                  (prescription?.url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={prescription.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl font-semibold text-sm hover:bg-teal-100 transition-colors border border-teal-200"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        View Prescription
                      </a>
                      <button
                        onClick={handleGeneratePrescription}
                        disabled={generateMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors border border-slate-200 disabled:opacity-50"
                        title="Regenerate prescription with latest edits"
                      >
                        {generateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Update Prescription
                      </button>
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-colors border border-indigo-200"
                        title="Share prescription via a unique link"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Prescription
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGeneratePrescription}
                      disabled={generateMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
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

      <main className="mx-auto max-w-screen-2xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Medications & Diagnoses (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Medications */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-rose-500" />
                  Medications
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
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                medications && medications.length > 0 ? (
                  <ul className="space-y-3">
                    {medications.map((m: Medication) => (
                      <li
                        key={m.id}
                        className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50"
                      >
                        <p className="text-sm font-bold text-slate-800 mb-1">
                          {m.name}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          {m.dosage && <span>{m.dosage}</span>}
                          {m.frequency && <span>• {m.frequency}</span>}
                          {m.duration && <span>• {m.duration}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No medications extracted.
                  </p>
                )
              ) : (
                <ul className="space-y-3">
                  {editData?.medications?.map((m: EditMed, index: number) => (
                    <li
                      key={index}
                      className="p-3 bg-white rounded-xl border border-slate-200 relative group"
                    >
                      <button
                        onClick={() => {
                          if (!editData || !editData.medications) return;
                          const newMeds = [...editData.medications];
                          newMeds.splice(index, 1);
                          setEditData({ ...editData, medications: newMeds });
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded bg-slate-50 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                        className="w-full mb-2 p-1.5 pr-8 text-sm font-bold bg-slate-50 border border-slate-200 rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
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
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded"
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
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded"
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
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded col-span-2"
                        />
                      </div>
                    </li>
                  ))}
                  {editData?.medications?.length === 0 && (
                    <p className="text-sm text-slate-500 italic">
                      No medications.
                    </p>
                  )}
                </ul>
              )}
            </div>

            {/* Diagnoses */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-indigo-500" />
                  Diagnoses
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
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                diagnoses && diagnoses.length > 0 ? (
                  <ul className="space-y-3">
                    {diagnoses.map((d: Diagnosis) => (
                      <li
                        key={d.id}
                        className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold font-mono">
                            {d.icd_code || "N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                          {d.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No diagnoses extracted.
                  </p>
                )
              ) : (
                <ul className="space-y-3">
                  {editData?.diagnoses?.map((d: EditDiag, index: number) => (
                    <li
                      key={index}
                      className="p-3 bg-white rounded-xl border border-slate-200 relative group"
                    >
                      <button
                        onClick={() => {
                          if (!editData || !editData.diagnoses) return;
                          const newDiags = [...editData.diagnoses];
                          newDiags.splice(index, 1);
                          setEditData({ ...editData, diagnoses: newDiags });
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded bg-slate-50 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        placeholder="ICD Code"
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
                        className="w-full mb-2 p-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
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
                        className="w-full p-1.5 text-sm bg-slate-50 border border-slate-200 rounded"
                      />
                    </li>
                  ))}
                  {editData?.diagnoses?.length === 0 && (
                    <p className="text-sm text-slate-500 italic">
                      No diagnoses.
                    </p>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Middle Column: SOAP Note (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                SOAP Note
              </h2>

              {!soap_note && !isEditing ? (
                <p className="text-sm text-slate-500 italic">
                  No SOAP note available.
                </p>
              ) : (
                <div className="space-y-6">
                  {(
                    ["subjective", "objective", "assessment", "plan"] as const
                  ).map((field) => (
                    <div key={field}>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                        {field}
                      </h3>
                      {isEditing ? (
                        <textarea
                          value={editData?.soap_note?.[field] || ""}
                          onChange={(e) => {
                            if (!editData) return;
                            setEditData({
                              ...editData,
                              soap_note: {
                                ...editData.soap_note,
                                [field]: e.target.value,
                              },
                            });
                          }}
                          className="w-full p-4 bg-white rounded-xl border border-slate-300 text-slate-900 text-sm whitespace-pre-wrap leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                        />
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                          {(
                            soap_note as unknown as Record<
                              string,
                              string | null
                            >
                          )?.[field] || "—"}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Raw Transcript
                    </h3>
                    <details className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer">
                      <summary className="font-medium outline-none">
                        View full audio transcript
                      </summary>
                      <div className="mt-3 pt-3 border-t border-slate-200 text-slate-500 whitespace-pre-wrap leading-relaxed">
                        {soap_note?.raw_transcript}
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Drug Interactions (lg:col-span-5 - much wider) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Drug Interactions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Drug Interactions
                </h2>
              </div>

              {consultation.interactions &&
              consultation.interactions.length > 0 ? (
                <ul className="space-y-4">
                  {consultation.interactions.map((interaction) => {
                    const isSevere = interaction.severity === "SEVERE";
                    const isMod = interaction.severity === "MODERATE";
                    const isMild = interaction.severity === "MILD";
                    const badgeBg = isSevere
                      ? "bg-red-100 text-red-700 border-red-200"
                      : isMod
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : isMild
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <li
                        key={interaction.id}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-slate-800">
                            {interaction.drug_a} & {interaction.drug_b}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}
                          >
                            {interaction.severity}
                          </span>
                        </div>

                        {interaction.mechanism && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            <strong className="text-slate-700">
                              Mechanism:
                            </strong>{" "}
                            {interaction.mechanism}
                          </p>
                        )}

                        {interaction.recommendation && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            <strong className="text-slate-700">Action:</strong>{" "}
                            {interaction.recommendation}
                          </p>
                        )}

                        {interaction.guideline_ref && (
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-medium">
                              📖 {interaction.guideline_ref}
                            </span>
                            {interaction.confidence != null && (
                              <span className="font-semibold bg-slate-200/60 px-2 py-0.5 rounded">
                                Conf: {Math.round(interaction.confidence * 100)}
                                %
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No significant drug interactions detected.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

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
              <p className="text-sm text-slate-600 mb-4 font-medium">
                Copy unique link
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-mono truncate select-all" title={prescription?.share_url || `/consultations/public/${id}/prescription`}>
                  {prescription?.share_url || `Generating secure link...`}
                </div>
                <button
                  onClick={() => {
                    const linkToCopy = prescription?.share_url || `${window.location.origin}/consultations/public/${id}/prescription`;
                    navigator.clipboard.writeText(linkToCopy);
                    toast.success("Secure share link copied to clipboard!");
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className={`px-4 py-2 text-white rounded-xl text-sm font-semibold transition-colors shrink-0 flex items-center gap-2 ${
                    isCopied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"
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
