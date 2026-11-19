"use client";

import React from "react";
import { Mic, FileSpreadsheet, AlertTriangle, FileCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const workflowSteps = [
  {
    step: "01",
    title: "Ambient Recording",
    icon: Mic,
    description:
      "Initiate consultation recording with a single click or hotkey. Audio streams securely to Deepgram Nova-2 with word-level millisecond synchronization.",
    footnote: "Encrypted WebSocket stream",
  },
  {
    step: "02",
    title: "SOAP Structuring",
    icon: FileSpreadsheet,
    description:
      "Medical LLM extracts Subjective, Objective, Assessment, and Plan fields with explicit [AI Draft] provenance indicators and ICD-10 diagnostic coding.",
    footnote: "Zero prompt injection vulnerability",
  },
  {
    step: "03",
    title: "Safety Interception",
    icon: AlertTriangle,
    description:
      "RAG vector search cross-references medications against patient history and clinical formularies. Critical contraindications require explicit doctor acknowledgment.",
    footnote: "WHO & FDA guideline embeddings",
  },
  {
    step: "04",
    title: "Clinician Sign-off",
    icon: FileCheck,
    description:
      "The physician verifies or edits the note, stamps their registered cryptographic signature, and generates a tamper-evident prescription sharing link.",
    footnote: "21 CFR Part 11 compliant",
  },
];

export function GuideSection() {
  return (
    <section id="workflow" className="py-20 lg:py-28 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-card text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Clinical Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            From Verbal Dialogue to Signed Prescription in Minutes
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A frictionless, predictable four-stage pipeline designed for doctors who want zero cognitive overhead during active patient encounters.
          </p>
        </div>

        {/* 4-Step Linear Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-primary/30 font-mono">
                      {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-[var(--radius-xs)] bg-muted/60 border border-border flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
                  {item.footnote}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-[var(--radius-lg)] border border-border bg-muted/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">
              Ready to streamline clinical documentation at your practice?
            </h4>
            <p className="text-xs text-muted-foreground">
              Setup takes less than 2 minutes with automated credential verification.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs shrink-0"
          >
            <span>Launch Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
