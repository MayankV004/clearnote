"use client";

import React, { useState } from "react";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiffViewProps {
  originalText: string;
  editedText: string;
  originalLabel?: string;
  editedLabel?: string;
  className?: string;
}

export function DiffView({
  originalText,
  editedText,
  originalLabel = "Original AI Draft",
  editedLabel = "Clinician Edits",
  className,
}: DiffViewProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "inline">("side-by-side");
  const hasChanges = originalText.trim() !== editedText.trim();

  const renderInlineDiff = () => {
    if (!hasChanges) {
      return <p className="text-sm text-foreground">{editedText}</p>;
    }

    return (
      <div className="space-y-3 text-sm leading-relaxed">
        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-[var(--radius-sm)] text-rose-900 dark:text-rose-200">
          <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 mb-1">
            Replaced / Deleted from AI Draft:
          </p>
          <span className="line-through">{originalText}</span>
        </div>
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-[var(--radius-sm)] text-emerald-900 dark:text-emerald-200">
          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            Verified / Clinician Additions:
          </p>
          <span>{editedText}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("rounded-[var(--radius-md)] border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <GitCompare className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">Audit Diff Comparison</span>
          {!hasChanges && (
            <span className="text-[10px] text-muted-foreground font-mono">(No edits made)</span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-[var(--radius-xs)] border border-border/60">
          <button
            type="button"
            onClick={() => setViewMode("side-by-side")}
            className={cn(
              "px-2 py-0.5 rounded-[2px] font-medium transition-colors cursor-pointer",
              viewMode === "side-by-side" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("inline")}
            className={cn(
              "px-2 py-0.5 rounded-[2px] font-medium transition-colors cursor-pointer",
              viewMode === "inline" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Inline
          </button>
        </div>
      </div>

      <div className="p-4">
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3 rounded-[var(--radius-sm)] bg-muted/30 border border-border/80">
              <p className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                {originalLabel}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {originalText || <span className="italic text-muted-foreground">Empty</span>}
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-[var(--radius-sm)] bg-accent/20 border border-primary/20">
              <p className="text-[10px] uppercase font-bold text-primary font-mono">
                {editedLabel}
              </p>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {editedText || <span className="italic text-muted-foreground">Empty</span>}
              </p>
            </div>
          </div>
        ) : (
          renderInlineDiff()
        )}
      </div>
    </div>
  );
}
