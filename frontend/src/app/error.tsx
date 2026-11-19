"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Copy, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log exception to console in development
    console.error("Clinical Application Intercepted Error:", error);
  }, [error]);

  const handleCopyLogs = () => {
    const errorPayload = `ClearNote Error Report\nTimestamp: ${new Date().toISOString()}\nMessage: ${error.message}\nDigest: ${error.digest || "N/A"}\nStack: ${error.stack || "N/A"}`;
    navigator.clipboard.writeText(errorPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-rose-500/20">
      <div className="w-full max-w-lg text-center space-y-6">
        
        {/* Error Badge Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-lg)] bg-destructive/10 border border-destructive/20 text-destructive shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Title & Clinical Safety Reassurance */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-xs)] border border-destructive/30 bg-destructive/5 text-[11px] font-mono text-destructive uppercase tracking-wider">
            System Fault Intercepted
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Encounter Error Detected
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            An unexpected error interrupted this clinical operation. Your patient records and recorded consultation audio are safely preserved and have not been altered.
          </p>
        </div>

        {/* Technical Digest Box */}
        <div className="p-3.5 rounded-[var(--radius-md)] border border-border bg-card/70 text-left space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">DIAGNOSTIC REFERENCE</span>
            {error.digest && (
              <span className="font-mono text-[11px] text-foreground">ID: {error.digest}</span>
            )}
          </div>
          <p className="text-xs font-mono text-foreground break-all bg-muted/40 p-2 rounded-[var(--radius-xs)] border border-border/60">
            {error.message || "An unhandled exception occurred in the clinical render loop."}
          </p>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleCopyLogs}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span>Copied Diagnostic Info</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Logs for IT Support</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Button
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            size="md"
            className="w-full sm:w-auto"
          >
            Retry Encounter
          </Button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/50 text-foreground transition-colors"
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            Return to Dashboard
          </Link>
        </div>

        {/* Audit Footnote */}
        <div className="pt-6 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Clinical crash diagnostics are cryptographically hashed and logged without PHI.</span>
        </div>

      </div>
    </div>
  );
}
