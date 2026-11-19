"use client";

import React from "react";
import { ShieldCheck, Lock, Database, FileText } from "lucide-react";

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: "HIPAA Covered Entity BAA",
    description:
      "Full Business Associate Agreements executed with healthcare practices. Architecture designed to satisfy all HIPAA Security and Privacy Rule mandates.",
  },
  {
    icon: Lock,
    title: "256-Bit Hardware Encryption",
    description:
      "All consultation audio files, clinical transcripts, and SOAP records are encrypted at rest using AES-256 and in transit via TLS 1.3.",
  },
  {
    icon: Database,
    title: "PostgreSQL Row-Level Security (RLS)",
    description:
      "Database-enforced tenant boundaries guarantee that attending physicians and clinical staff can only access patient charts within their verified institution.",
  },
  {
    icon: FileText,
    title: "Audit Logs with Masked PHI",
    description:
      "Every mutation, export, and review action is cryptographically recorded. Patient identifiers and contact details are automatically masked in system logs.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-20 lg:py-28 border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-background text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Enterprise Compliance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Healthcare-Grade Security by Default
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Clinical trust requires uncompromising security. We treat protected health information (PHI) with the highest standards of confidentiality and integrity.
          </p>
        </div>

        {/* Security Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {sec.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {sec.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
