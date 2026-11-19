"use client";

import { Sparkles, CheckCheck } from "lucide-react";
import type { SOAPNote } from "../types";

interface SoapNoteEditorProps {
  soapNote?: SOAPNote | null;
  isEditing: boolean;
  values: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  onChange: (field: "subjective" | "objective" | "assessment" | "plan", value: string) => void;
  isVerified?: boolean;
}

export function SoapNoteEditor({
  soapNote,
  isEditing,
  values,
  onChange,
  isVerified = false,
}: SoapNoteEditorProps) {
  const sections = [
    {
      key: "subjective" as const,
      label: "Subjective (S)",
      subtitle: "Patient-reported symptoms, chief complaint, and history",
      placeholder: "e.g. Patient reports dry cough for 3 days...",
    },
    {
      key: "objective" as const,
      label: "Objective (O)",
      subtitle: "Measurable vitals, physical examination, and lab findings",
      placeholder: "e.g. BP 120/80, HR 72, lungs clear bilaterally...",
    },
    {
      key: "assessment" as const,
      label: "Assessment (A)",
      subtitle: "Clinical synthesis, diagnostic impression, and condition status",
      placeholder: "e.g. Acute bronchitis, essential hypertension...",
    },
    {
      key: "plan" as const,
      label: "Plan (P)",
      subtitle: "Prescriptions, investigations, patient instructions, follow-up",
      placeholder: "e.g. Prescribe Azithromycin 500mg daily, follow up in 1 week...",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Provenance Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">SOAP Clinical Documentation</h2>
          <p className="text-xs text-slate-500">Universal standard medical progress note</p>
        </div>
        <div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              Clinician Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              AI Drafted
            </span>
          )}
        </div>
      </div>

      {/* 4 SOAP Blocks */}
      <div className="space-y-4">
        {sections.map(({ key, label, subtitle, placeholder }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="mb-2">
              <span className="font-bold text-sm text-slate-900">{label}</span>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>

            {isEditing ? (
              <textarea
                value={values[key]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 leading-relaxed font-sans"
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {values[key] || soapNote?.[key] || (
                  <span className="text-slate-400 italic">No notes recorded.</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
