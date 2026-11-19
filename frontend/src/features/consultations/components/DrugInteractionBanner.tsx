"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ShieldCheck, BookOpen } from "lucide-react";
import type { Interaction } from "../types";

interface DrugInteractionBannerProps {
  interactions: Interaction[];
  onAcknowledgeAll?: (acknowledged: boolean) => void;
}

export function DrugInteractionBanner({
  interactions,
  onAcknowledgeAll,
}: DrugInteractionBannerProps) {
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});

  if (!interactions || interactions.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            No Pharmacological Conflicts Detected
          </p>
          <p className="text-xs text-emerald-700">
            Prescribed medications and patient allergies were verified against clinical guidelines.
          </p>
        </div>
      </div>
    );
  }

  const toggleAcknowledge = (id: string) => {
    const next = { ...acknowledgedMap, [id]: !acknowledgedMap[id] };
    setAcknowledgedMap(next);
    if (onAcknowledgeAll) {
      const allCriticalAcknowledged = interactions
        .filter((i) => i.severity === "SEVERE" || i.severity === "CRITICAL")
        .every((i) => next[i.id]);
      onAcknowledgeAll(allCriticalAcknowledged);
    }
  };

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => {
        const isCritical =
          interaction.severity === "SEVERE" || interaction.severity === "CRITICAL";
        const isModerate =
          interaction.severity === "MODERATE" || interaction.severity === "WARNING";
        const isAcked = !!acknowledgedMap[interaction.id];

        let containerClass = "border-slate-200 bg-slate-50 text-slate-800";
        let icon = <Info className="w-5 h-5 text-slate-500" />;
        let badgeClass = "bg-slate-200 text-slate-700";

        if (isCritical) {
          containerClass = "border-rose-300 bg-rose-50/80 text-rose-950";
          icon = <AlertTriangle className="w-5 h-5 text-rose-600" />;
          badgeClass = "bg-rose-100 text-rose-800 border border-rose-200";
        } else if (isModerate) {
          containerClass = "border-amber-300 bg-amber-50/80 text-amber-950";
          icon = <AlertCircle className="w-5 h-5 text-amber-600" />;
          badgeClass = "bg-amber-100 text-amber-800 border border-amber-200";
        }

        return (
          <div
            key={interaction.id}
            className={`rounded-2xl border p-4 shadow-sm transition-all ${containerClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {icon}
                <span className="font-bold text-sm">
                  {interaction.drug_a} + {interaction.drug_b}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${badgeClass}`}
                >
                  {interaction.severity}
                </span>
                {interaction.confidence != null && (
                  <span className="text-[10px] text-slate-500 font-medium bg-white/70 px-2 py-0.5 rounded-full border border-slate-200">
                    {Math.round(interaction.confidence * 100)}% match
                  </span>
                )}
              </div>
            </div>

            {interaction.mechanism && (
              <p className="mt-2 text-xs leading-relaxed opacity-90">
                <strong className="font-semibold">Mechanism:</strong> {interaction.mechanism}
              </p>
            )}

            {interaction.recommendation && (
              <p className="mt-1.5 text-xs leading-relaxed font-medium">
                <strong className="font-semibold">Action:</strong> {interaction.recommendation}
              </p>
            )}

            {interaction.guideline_ref && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-white/60 px-2.5 py-1 rounded-md border border-slate-200/60 w-fit">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>{interaction.guideline_ref}</span>
              </div>
            )}

            {isCritical && (
              <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`ack-${interaction.id}`}
                  checked={isAcked}
                  onChange={() => toggleAcknowledge(interaction.id)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <label
                  htmlFor={`ack-${interaction.id}`}
                  className="text-xs font-semibold text-rose-900 cursor-pointer select-none"
                >
                  I have evaluated this clinical interaction and confirmed patient safety
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
