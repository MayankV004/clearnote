"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pill, Stethoscope, AlertCircle, FileText, FileDown, CheckCircle2 } from "lucide-react";
import { useConsultation } from "@/features/consultations/api/useConsultation";
import { useGeneratePrescription, usePrescription } from "@/features/consultations/api/usePrescription";
import { formatDate } from "@/lib/utils";

export default function ConsultationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation, isLoading, isError, error } = useConsultation(id);
  const { data: prescription, isLoading: isCheckingPrescription, refetch: refetchPrescription } = usePrescription(
    consultation?.status === "COMPLETE" ? id : null
  );
  const generateMutation = useGeneratePrescription();

  const handleGeneratePrescription = async () => {
    try {
      await generateMutation.mutateAsync(id);
      refetchPrescription();
    } catch (error) {
      console.error("Failed to generate prescription:", error);
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
      ? (error instanceof Error ? error.message : "Failed to load consultation.")
      : "Consultation not found.";
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-red-500 font-semibold">{message}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-teal-600 hover:underline">
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
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium">Consultation Review</p>
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
              prescription?.url ? (
                <a
                  href={prescription.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl font-semibold text-sm hover:bg-teal-100 transition-colors border border-teal-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Prescription
                </a>
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
              )
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: SOAP Note */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                SOAP Note
              </h2>

              {!soap_note ? (
                <p className="text-sm text-slate-500 italic">No SOAP note available.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Subjective</h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {soap_note.subjective || "—"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Objective</h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {soap_note.objective || "—"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Assessment</h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {soap_note.assessment || "—"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Plan</h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {soap_note.plan || "—"}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Raw Transcript</h3>
                    <details className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer">
                      <summary className="font-medium outline-none">View full audio transcript</summary>
                      <div className="mt-3 pt-3 border-t border-slate-200 text-slate-500 whitespace-pre-wrap leading-relaxed">
                        {soap_note.raw_transcript}
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Meds & Diagnoses */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Diagnoses */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-500" />
                Diagnoses
              </h2>
              {diagnoses && diagnoses.length > 0 ? (
                <ul className="space-y-3">
                  {diagnoses.map((d) => (
                    <li key={d.id} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold font-mono">
                          {d.icd_code || "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{d.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No diagnoses extracted.</p>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-500" />
                Medications
              </h2>
              {medications && medications.length > 0 ? (
                <ul className="space-y-3">
                  {medications.map((m) => (
                    <li key={m.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                      <p className="text-sm font-bold text-slate-800 mb-1">{m.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {m.dosage && <span>{m.dosage}</span>}
                        {m.frequency && <span>• {m.frequency}</span>}
                        {m.duration && <span>• {m.duration}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No medications extracted.</p>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
