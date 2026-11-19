import React from "react";
import Link from "next/link";
import { FileQuestion, Home, Search, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-teal-500/20">
      <div className="w-full max-w-lg text-center space-y-6">
        
        {/* Clinical Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-lg)] bg-muted/60 border border-border text-muted-foreground shadow-sm">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>

        {/* Header & Explanation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-xs)] border border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            HTTP 404 / Record Not Found
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Clinical Resource Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            The requested medical encounter, patient chart, or clinical route does not exist or may have been archived. All active patient records remain protected and unchanged.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-[var(--radius-sm)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/50 text-foreground transition-colors"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            Find Patient or Encounter
          </Link>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
          Tip: Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-border bg-muted">⌘K</kbd> anywhere to open the clinical command palette.
        </p>

        {/* Regulatory Audit Footnote */}
        <div className="pt-6 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Access attempts are monitored and logged pursuant to HIPAA 45 CFR § 164.312.</span>
        </div>

      </div>
    </div>
  );
}
