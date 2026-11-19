"use client";

import React, { useState } from "react";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Lock,
  FileCheck,
  Stethoscope,
} from "lucide-react";
import { SignatureCanvas } from "@/features/doctor/components/SignatureCanvas";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    id: 1,
    title: "Professional Credentials",
    subtitle: "Medical specialty, experience & state license",
    icon: Stethoscope,
  },
  {
    id: 2,
    title: "Practice & Clinic Information",
    subtitle: "Primary hospital or practice address and contact",
    icon: Building2,
  },
  {
    id: 3,
    title: "Prescription Signature",
    subtitle: "Digital signature pad & clinical biography",
    icon: FileCheck,
  },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, text: "HIPAA-compliant BAA protected data store" },
  { icon: Lock, text: "256-bit AES encryption at rest and in transit" },
  { icon: FileCheck, text: "License stamped onto legal prescription PDFs" },
];

export default function DevOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              +
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">ClearNote</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Clinical Setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row mx-auto max-w-7xl w-full">
        {/* Left Sidebar Checklist */}
        <aside className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-border p-8 justify-between bg-card/40">
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Physician Onboarding
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
                Welcome, Dr. Sarah Jenkins
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Configure your practice credentials to unlock automated transcription, SOAP notes, and legal e-prescriptions.
              </p>
            </div>

            <nav className="space-y-3" aria-label="Onboarding Steps">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.id;
                const isCurrent = currentStep === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-[var(--radius-md)] border transition-colors cursor-pointer ${
                      isCurrent
                        ? "border-primary/40 bg-primary/5 text-foreground shadow-xs"
                        : isCompleted
                        ? "border-border bg-card/60 text-muted-foreground"
                        : "border-transparent text-muted-foreground/60"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                        {s.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-border/60 space-y-2.5">
            {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-mono"
              >
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-lg w-full mx-auto space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {Math.round(progressPct)}% Completed
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {STEPS[currentStep - 1].title}
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {STEPS[currentStep - 1].subtitle}
              </p>
            </div>

            <div className="h-1.5 w-full bg-muted rounded-[var(--radius-xs)] overflow-hidden">
              <div
                className="h-full bg-primary rounded-[var(--radius-xs)] transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progressPct, 5)}%` }}
              />
            </div>

            <div className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Medical Specialty <span className="text-destructive">*</span>
                    </label>
                    <input
                      defaultValue="Internal Medicine"
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground">
                        Years of Experience <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        defaultValue={14}
                        className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-foreground">
                        Medical License # <span className="text-destructive">*</span>
                      </label>
                      <input
                        defaultValue="MED-NY-849201"
                        className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono uppercase"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono">
                    Your state license number will be automatically stamped onto PDF prescriptions generated for your patients.
                  </p>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Practice or Hospital Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      defaultValue="Mount Sinai West Outpatient Clinic"
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Clinic Street Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      defaultValue="1000 10th Ave, New York, NY 10019"
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Workplace Direct Phone <span className="text-destructive">*</span>
                    </label>
                    <input
                      defaultValue="+1 (555) 234-5678"
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Professional Biography <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="Attending physician specializing in adult internal medicine, multi-condition chronic care, and pharmacological polypharmacy optimization."
                      className="w-full text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground p-2.5 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-y"
                    />
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <SignatureCanvas />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCurrentStep((p) => Math.min(p + 1, 3))}
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => alert("Profile completed!")}
                  >
                    Complete Clinical Profile
                    <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
