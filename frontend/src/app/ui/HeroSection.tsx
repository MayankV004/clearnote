"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, Activity, FileCheck } from "lucide-react";
import { ClinicalPreviewSimulator } from "./ClinicalPreviewSimulator";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-border bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        
        {/* Clinical Assurance Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-xs)] border border-border bg-card text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-6 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>HIPAA BAA Protected • Clinical Safety Guardrails</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1] mb-6">
          AI Documentation That Clinicians{" "}
          <span className="text-primary">Actually Trust.</span>
        </h1>

        {/* Clinical Value Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Record outpatient consultations ambiently. Synthesize structured SOAP notes with word-level audio grounding. Intercept drug harms before prescriptions leave the exam room.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius-sm)] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <span>Start Free Clinical Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/50 text-foreground font-medium text-sm transition-colors shadow-xs"
          >
            <span>Explore Clinical Hub</span>
          </Link>
        </div>

        {/* Interactive Clinical Preview Simulator */}
        <div className="max-w-4xl mx-auto mb-12">
          <ClinicalPreviewSimulator />
        </div>

        {/* Enterprise Trust Metric Bar */}
        <div className="max-w-4xl mx-auto pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">HIPAA BAA Enforced</p>
              <p className="text-[10px] text-muted-foreground">Executed entity protection</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">256-bit AES at Rest</p>
              <p className="text-[10px] text-muted-foreground">Encrypted PHI databases</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Deepgram Nova-2</p>
              <p className="text-[10px] text-muted-foreground">Medical acoustic modeling</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">21 CFR Part 11</p>
              <p className="text-[10px] text-muted-foreground">Cryptographic signatures</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
