"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Clock, Stethoscope, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";

export function AuthLayout({
  children,
  title = "Sign In to Your Clinic Portal",
  subtitle = "Securely access your clinical documentation workspace.",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="border-b border-border/70 bg-card/80 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              +
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">ClearNote</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Clinical Health
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="primary" dot>
              HIPAA Compliant
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Reveal className="w-full max-w-4xl" duration={0.24}>
          <div className="rounded-[var(--radius-lg)] border border-border bg-card shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Clerk Form (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              <div className="w-full flex justify-center">
                {children}
              </div>
            </div>

            {/* Right Column: Protected Health System Credentials (5 cols) */}
            <div className="lg:col-span-5 bg-muted/40 border-t lg:border-t-0 lg:border-l border-border p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Protected Clinical System
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>256-bit AES encryption at rest &amp; in transit with AWS KMS.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>Complies with HIPAA Security Rule 45 CFR § 164.312.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>Automated 15-minute inactivity timeout for clinical workstations.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Stethoscope className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>Mandatory attending physician sign-off before prescription issue.</span>
                  </li>
                </ul>

                <blockquote className="rounded-[var(--radius-sm)] border border-border/80 bg-card/60 p-3.5 text-xs text-foreground/90 leading-relaxed italic">
                  &ldquo;ClearNote saves our outpatient clinic 2.5 hours of charting daily while preventing dangerous drug interactions before prescriptions are signed.&rdquo;
                  <footer className="text-[11px] text-muted-foreground not-italic font-semibold mt-2">
                    — Chief Medical Officer, Internal Medicine
                  </footer>
                </blockquote>
              </div>

              <div className="pt-4 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  security@clearnote.ai
                </span>
                <span className="font-mono">v1.2.0</span>
              </div>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
