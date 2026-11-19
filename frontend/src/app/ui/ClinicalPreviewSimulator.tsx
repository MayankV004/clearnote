"use client";

import React, { useState } from "react";
import {
  Mic,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  ShieldCheck,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CitationChip } from "@/components/clinical/CitationChip";
import { ConfidenceIndicator } from "@/components/clinical/ConfidenceIndicator";

const SIMULATOR_STEPS = [
  {
    id: "audio",
    label: "1. Ambient Capture",
    short: "Audio & Transcript",
    icon: Mic,
  },
  {
    id: "soap",
    label: "2. SOAP Structuring",
    short: "Clinical Extraction",
    icon: FileText,
  },
  {
    id: "rag",
    label: "3. RAG Safety Guardrail",
    short: "Drug Harms Intercept",
    icon: AlertTriangle,
  },
  {
    id: "sign",
    label: "4. Physician Sign-off",
    short: "Cryptographic Rx",
    icon: FileCheck,
  },
];

export function ClinicalPreviewSimulator() {
  const [activeStep, setActiveStep] = useState<string>("audio");
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div
      id="simulator"
      className="w-full rounded-[var(--radius-lg)] border border-border bg-card shadow-lg overflow-hidden text-left"
    >
      {/* Simulator Window Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-4 py-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-xs font-mono font-semibold text-foreground">
            ClearNote Clinical Workspace Demo
          </span>
          <span className="hidden sm:inline-block text-[10px] text-muted-foreground font-mono">
            • Patient: Michael R. (MRN: PAT-849201)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Synthetic Clinical Simulation</span>
        </div>
      </div>

      {/* Simulator Step Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border bg-card">
        {SIMULATOR_STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                isActive
                  ? "border-primary text-foreground bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 sm:p-6 min-h-[380px] flex flex-col justify-between">
        
        {/* STEP 1: Ambient Audio & Verbatim Transcript */}
        {activeStep === "audio" && (
          <div className="space-y-4">
            {/* Audio Waveform Player Bar */}
            <div className="rounded-[var(--radius-md)] border border-border bg-muted/30 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Encounter Audio Stream (Deepgram Nova-2)
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    01:24 / 03:45 • High-fidelity clinical speech model
                  </p>
                </div>
              </div>

              {/* Synthetic audio frequency bars */}
              <div className="flex items-center gap-1 h-6">
                {[12, 20, 16, 24, 8, 18, 22, 14, 20, 10, 16, 22, 8, 18].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-primary/70 rounded-full transition-all duration-300"
                      style={{ height: isPlaying ? `${height}px` : "6px" }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Verbatim Dialogue Transcript */}
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-3">
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  00:14
                </span>
                <div>
                  <span className="font-semibold text-primary">Doctor: </span>
                  <span className="text-foreground">
                    Good morning, Michael. How has that throat been feeling since Tuesday?
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-3">
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  00:22
                </span>
                <div>
                  <span className="font-semibold text-muted-foreground">Patient: </span>
                  <span className="text-foreground">
                    Much worse, Doctor. It hurts severely to swallow even water, and I developed fever last night around 101 degrees.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-3">
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  00:35
                </span>
                <div>
                  <span className="font-semibold text-primary">Doctor: </span>
                  <span className="text-foreground">
                    Let us take a look. Any known drug allergies, especially to Penicillin or Amoxicillin?
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-3 bg-destructive/5 border-destructive/20">
                <span className="font-mono text-[10px] text-destructive shrink-0 mt-0.5">
                  00:41
                </span>
                <div>
                  <span className="font-semibold text-destructive">Patient: </span>
                  <span className="text-foreground font-medium">
                    Yes, severe hives and lip swelling whenever I take Penicillin. It is listed on my old chart.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SOAP Structuring */}
        {activeStep === "soap" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-[var(--radius-md)] border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">S • SUBJECTIVE</span>
                <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  AI Drafted
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                38yo male presenting with acute onset of severe odynophagia and fever x 3 days. Patient confirms documented severe Penicillin allergy (urticaria, lip swelling).
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">O • OBJECTIVE</span>
                <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  AI Drafted
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Oral temp: 101.4°F. Oropharynx: Bilateral 3+ tonsillar enlargement with purulent exudates. Tender anterior cervical lymphadenopathy.
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">A • ASSESSMENT</span>
                <span className="font-mono text-[10px] text-primary">ICD-10: J02.0</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Acute Streptococcal Pharyngitis. Patient Centor score 4/4 indicating high probability of group A strep.
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">P • PLAN</span>
                <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400">
                  Prescribed
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Azithromycin 250mg PO x 5 days (500mg Day 1, 250mg Days 2-5). Warm saline gargles, Ibuprofen 400mg PO PRN fever/pain.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: RAG Safety Guardrail Interception */}
        {activeStep === "rag" && (
          <div className="space-y-4">
            {/* Critical Alert Banner */}
            <div className="rounded-[var(--radius-md)] border border-destructive/40 bg-destructive/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  <span>CRITICAL CONTRAINDICATION INTERCEPTED</span>
                </div>
                <Badge variant="destructive" className="text-[10px]">
                  Safety Intercept Level 1
                </Badge>
              </div>
              <p className="text-xs text-foreground font-semibold">
                Amoxicillin 500mg PO withheld due to documented Penicillin anaphylaxis in patient chart.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The baseline AI draft suggested standard first-line Amoxicillin. ClearNote RAG vector inspection cross-referenced patient dialogue token &quot;severe hives&quot; against medical guidelines and flagged lethal cross-sensitivity.
              </p>
            </div>

            {/* Citation & Evidence Provenance */}
            <div className="rounded-[var(--radius-md)] border border-border bg-card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Grounding Evidence Provenance</span>
                <ConfidenceIndicator score={0.96} compact />
              </div>
              <CitationChip
                title="WHO Model Formulary - Section 6.2: Beta-Lactam Anaphylaxis & Macrolide Alternatives"
                source="WHO Guidelines"
                confidence={0.96}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Recommendation: Withhold beta-lactams. Substitute with oral Azithromycin 250mg or Clindamycin 300mg.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Clinician Sign-Off & Prescription Stamp */}
        {activeStep === "sign" && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-teal-500/30 bg-teal-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Encounter Signed & Verified</span>
                </div>
                <p className="text-xs text-foreground">
                  Prescription cryptographically sealed with attending physician signature stamp.
                </p>
              </div>
              <Badge variant="outline" className="border-teal-500/40 text-teal-700 dark:text-teal-300 text-xs">
                21 CFR Part 11 Compliant
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-card space-y-2">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">
                  Attending Clinician
                </span>
                <p className="font-semibold text-foreground">Dr. Alexander Wright, MD</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  CA Medical License: C-8492019-CA
                </p>
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">Signature affixed:</span>
                  <div className="font-serif italic text-base text-foreground mt-0.5">
                    Alex Wright MD
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-card space-y-2">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">
                  Secure Sharing Token
                </span>
                <p className="font-semibold text-foreground">HMAC-SHA256 Encrypted URL</p>
                <p className="text-[11px] text-muted-foreground font-mono break-all">
                  clearnote.health/rx/pat-849201?token=4f9a7c8...
                </p>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Expires in 7 days</span>
                  <span className="text-primary font-medium">Ready for Patient</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Interactive Step Switcher */}
        <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Click any tab above to inspect each clinical governance stage</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const stepIds = SIMULATOR_STEPS.map((s) => s.id);
                const nextIdx = (stepIds.indexOf(activeStep) + 1) % stepIds.length;
                setActiveStep(stepIds[nextIdx]);
              }}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
