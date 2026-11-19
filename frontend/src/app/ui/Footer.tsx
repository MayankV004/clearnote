"use client";

import React from "react";
import Link from "next/link";
import { Stethoscope, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 py-12 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                ClearNote
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Quiet-confidence clinical documentation and pharmacological safety guardrails for outpatient physicians, medical directors, and healthcare practices.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>HIPAA BAA Protected • 256-bit AES Hardware Encryption</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Platform
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="#simulator" className="hover:text-foreground transition-colors">
                  Interactive Simulator
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  System Capabilities
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="hover:text-foreground transition-colors">
                  Clinical Workflow
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Clinical Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Compliance & Legal
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="#security" className="hover:text-foreground transition-colors">
                  HIPAA Security Rule
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">21 CFR Part 11 Signatures</span>
              </li>
              <li>
                <span className="text-muted-foreground/80">DEA Electronic Prescribing</span>
              </li>
              <li>
                <span className="text-muted-foreground/80">Privacy Policy (45 CFR § 164.520)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-muted-foreground">
          <p className="max-w-2xl leading-relaxed">
            <strong className="text-foreground">Clinical Notice:</strong> ClearNote provides AI-assisted clinical documentation and pharmacological decision support. All generated notes, ICD-10 suggestions, and prescriptions must be independently verified and approved by a licensed medical provider prior to clinical execution.
          </p>
          <p className="shrink-0 font-mono">
            © {new Date().getFullYear()} ClearNote Health, Inc.
          </p>
        </div>

      </div>
    </footer>
  );
}
