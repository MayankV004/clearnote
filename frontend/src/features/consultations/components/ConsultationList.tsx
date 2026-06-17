"use client";

import { useConsultations } from "../api/useConsultations";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function ConsultationList({ patientId }: { patientId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useConsultations(patientId);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Failed to load consultations</p>
        <p className="text-xs text-slate-500 mt-1">{error?.message || "Unknown error occurred"}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Consultation History</h3>
            <p className="text-sm text-slate-500 mt-0.5">Past visits and notes</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="font-semibold text-slate-700">No consultations yet</h4>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Once you record a consultation session with this patient, it will appear here with the AI-generated SOAP note.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Consultation History</h3>
          <p className="text-sm text-slate-500 mt-0.5">{data.length} past visits</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((consultation) => (
          <div 
            key={consultation.id} 
            onClick={() => {
              if (consultation.status === "COMPLETE") {
                router.push(`/dashboard/consultations/${consultation.id}`);
              }
            }}
            className="border border-slate-100 rounded-2xl p-5 hover:border-teal-100 hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-bold text-slate-900">{formatDate(consultation.created_at)}</span>
              {consultation.status === "COMPLETE" && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide uppercase">
                  Complete
                </span>
              )}
              {consultation.status === "PROCESSING" && (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Processing
                </span>
              )}
              {consultation.status === "FAILED" && (
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold tracking-wide uppercase">
                  Failed
                </span>
              )}
              {consultation.status === "PENDING" && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wide uppercase">
                  Draft
                </span>
              )}
            </div>

            {consultation.status === "COMPLETE" && consultation.soap_note?.raw_transcript ? (
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                &quot;{consultation.soap_note.raw_transcript}&quot;
              </p>
            ) : consultation.status === "FAILED" ? (
              <p className="text-sm text-red-500">
                {consultation.processing_error || "An error occurred during transcription."}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Transcript not available yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
