"use client";

import { Plus, Mic, FileText } from "lucide-react";

interface QuickActionsProps {
  onAddPatient: () => void;
}

/**
 * Quick-action buttons shown in the dashboard sidebar.
 * Pure UI — no data fetching.
 */
export function QuickActions({ onAddPatient }: QuickActionsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        <button
          onClick={onAddPatient}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold transition-colors text-left"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          Add New Patient
        </button>

        <button
          disabled
          title="Coming soon"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium text-left cursor-not-allowed"
        >
          <Mic className="w-4 h-4 flex-shrink-0" />
          Record Consultation
          <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
            Soon
          </span>
        </button>

        <button
          disabled
          title="Coming soon"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium text-left cursor-not-allowed"
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          Generate SOAP Note
          <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
            Soon
          </span>
        </button>
      </div>
    </div>
  );
}
