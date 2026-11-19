"use client";

import React from "react";
import {
  Mic,
  ShieldAlert,
  FileSpreadsheet,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const capabilities = [
  {
    icon: Mic,
    tag: "Ambient Capture",
    title: "Verbatim Speech-to-Text with Deepgram Nova-2",
    description:
      "Captures doctor-patient dialogue in real-time through low-latency WebSockets. Generates synchronized word-level timestamps, allowing clinicians to click any sentence in the note to jump directly to the exact audio recording moment.",
    badge: "Sub-Second Latency",
  },
  {
    icon: ShieldAlert,
    tag: "Safety Intelligence",
    title: "pgvector RAG Pharmacological Harms Interceptor",
    description:
      "Every prescribed medication is continuously cross-referenced against patient dialogue allergies and medical conditions using cosine similarity search across authoritative WHO and FDA guideline embeddings.",
    badge: "Zero Hallucination Tolerance",
  },
  {
    icon: FileSpreadsheet,
    tag: "Clinical Synthesis",
    title: "Discrete SOAP Structuring with Provenance Tracking",
    description:
      "Automatically extracts Subjective symptoms, Objective vitals, Assessment ICD-10 codes, and Plan regimens into discrete editable fields. Explicit [AI Draft] markers transition to [Clinician Verified] upon manual review.",
    badge: "ICD-10 Mapped",
  },
  {
    icon: Link2,
    tag: "Compliant Delivery",
    title: "HMAC-SHA256 Cryptographic Prescription Sharing",
    description:
      "Generates tamper-evident, signed public links with 7-day expirations. Patients access branded, legible medication regimens with pharmacy-ready digital physician signatures without needing complex portal accounts.",
    badge: "21 CFR Part 11",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 border-b border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-background text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Clinical System Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Engineered for High-Acuity Outpatient Care
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            ClearNote is not a generic dictation assistant. It is a purpose-built clinical documentation system with integrated pharmacological safety guardrails and human-in-the-loop review.
          </p>
        </div>

        {/* 4-Feature Clinical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-6 sm:p-7 shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-muted/60 border border-border flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {cap.badge}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                      {cap.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-1 mb-2">
                      {cap.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-primary">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Integrated into every consultation</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
