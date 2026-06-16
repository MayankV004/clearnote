"use client";

import { Mic } from "lucide-react";

/**
 * Teaser card for upcoming AI consultation recording feature.
 * Pure UI — no data fetching or state.
 */
export function FeatureTeaser() {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-3xl p-5">
      <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
        <Mic className="w-4 h-4 text-white" />
      </div>
      <h3 className="font-bold text-slate-900 text-sm mb-1">
        AI Consultation Recording
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Record your consultations and let AI generate structured SOAP notes
        automatically. Coming very soon.
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
        In development
      </div>
    </div>
  );
}
