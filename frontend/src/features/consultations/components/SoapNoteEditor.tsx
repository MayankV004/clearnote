"use client";

import React from "react";
import { FileText } from "lucide-react";
import type { SOAPNote } from "../types";
import { Badge } from "@/components/ui/Badge";

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
      code: "S",
      label: "Subjective",
      subtitle: "Patient-reported symptoms, chief complaint, timeline",
      placeholder: "e.g. Patient presents with productive cough for 5 days...",
    },
    {
      key: "objective" as const,
      code: "O",
      label: "Objective",
      subtitle: "Measurable vitals, physical examination, diagnostic findings",
      placeholder: "e.g. Temp: 100.4F, BP: 128/84, Bilateral coarse rhonchi...",
    },
    {
      key: "assessment" as const,
      code: "A",
      label: "Assessment",
      subtitle: "Clinical synthesis, ICD-10 diagnosis, differential diagnosis",
      placeholder: "e.g. Acute bronchitis (J20.9), resolving URI...",
    },
    {
      key: "plan" as const,
      code: "P",
      label: "Plan",
      subtitle: "Therapeutic interventions, prescriptions, follow-up schedule",
      placeholder: "e.g. Azithromycin 500mg daily, follow-up in 10 days if symptoms persist...",
    },
  ];

  return (
    <div className="space-y-4">
      {/* SOAP Header with AI Provenance */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            SOAP Clinical Progress Documentation
          </h2>
          <p className="text-[11px] text-muted-foreground font-mono">
            Standard medical progress record with discrete clinical entities
          </p>
        </div>

        <div>
          {isVerified ? (
            <Badge variant="success" size="sm" dot>
              Clinician Verified
            </Badge>
          ) : (
            <Badge variant="ai" size="sm">
              AI Draft (Awaiting Review)
            </Badge>
          )}
        </div>
      </div>

      {/* 4 Discrete SOAP Section Blocks */}
      <div className="space-y-3.5">
        {sections.map(({ key, code, label, subtitle, placeholder }) => (
          <div
            key={key}
            className="rounded-[var(--radius-md)] border border-border bg-card p-4 shadow-xs space-y-2 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="w-5 h-5 rounded-[var(--radius-xs)] bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-[11px]">
                  {code}
                </span>
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                {subtitle}
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={values[key]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full text-xs font-sans text-foreground bg-background border border-input rounded-[var(--radius-sm)] p-2.5 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-y"
              />
            ) : (
              <div className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap min-h-[44px] p-1 rounded-[var(--radius-xs)] bg-muted/20 border border-transparent">
                {values[key] || soapNote?.[key] || (
                  <span className="text-muted-foreground italic font-mono text-[11px]">
                    No documentation recorded for this section.
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
