"use client";

import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from "lucide-react";
import type { Interaction } from "../types";
import { Badge } from "@/components/ui/Badge";
import { CitationChip } from "@/components/clinical/CitationChip";
import { cn } from "@/lib/utils";

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
      <div className="rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">
            No Pharmacological Conflicts Detected
          </p>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Prescribed medications and patient allergies verified against clinical formulary & guidelines.
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
    <div className="space-y-2.5" role="alert">
      {interactions.map((interaction) => {
        const isCritical =
          interaction.severity === "SEVERE" || interaction.severity === "CRITICAL";
        const isModerate =
          interaction.severity === "MODERATE" || interaction.severity === "WARNING";
        const isAcked = !!acknowledgedMap[interaction.id];

        let containerClass = "border-border bg-card text-foreground";
        let icon = <Info className="w-4 h-4 text-muted-foreground" />;
        let badgeVariant: "default" | "warning" | "destructive" = "default";

        if (isCritical) {
          containerClass =
            "border-destructive/30 bg-destructive/5 text-foreground";
          icon = <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
          badgeVariant = "destructive";
        } else if (isModerate) {
          containerClass = "border-amber-500/30 bg-amber-500/5 text-foreground";
          icon = <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
          badgeVariant = "warning";
        }

        return (
          <div
            key={interaction.id}
            className={cn(
              "rounded-[var(--radius-md)] border p-3.5 shadow-xs transition-colors space-y-2",
              containerClass
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {icon}
                <span className="font-bold text-xs font-mono truncate">
                  {interaction.drug_a} + {interaction.drug_b}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant={badgeVariant} size="sm">
                  {interaction.severity}
                </Badge>
                {interaction.confidence != null && (
                  <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-muted border border-border">
                    {Math.round(interaction.confidence * 100)}% conf
                  </span>
                )}
              </div>
            </div>

            {interaction.mechanism && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Mechanism:</strong>{" "}
                {interaction.mechanism}
              </p>
            )}

            {interaction.recommendation && (
              <p className="text-xs text-foreground leading-relaxed font-mono">
                <strong className="font-semibold text-primary">Recommendation:</strong>{" "}
                {interaction.recommendation}
              </p>
            )}

            {/* Guideline Source Citation */}
            {interaction.guideline_ref && (
              <div className="pt-1 flex items-center gap-2 text-[11px]">
                <CitationChip
                  title={interaction.guideline_ref}
                  confidence={interaction.confidence ?? undefined}
                />
              </div>
            )}

            {/* Clinician Acknowledgment Checkbox for Critical Alerts */}
            {isCritical && (
              <div className="pt-2 border-t border-destructive/20 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAcked}
                    onChange={() => toggleAcknowledge(interaction.id)}
                    className="w-4 h-4 rounded-[var(--radius-xs)] border-destructive text-destructive focus:ring-destructive accent-destructive"
                  />
                  <span className="text-xs font-semibold text-destructive">
                    Clinician acknowledges critical interaction risk
                  </span>
                </label>
                {isAcked && (
                  <Badge variant="success" size="sm">
                    Acknowledged
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
