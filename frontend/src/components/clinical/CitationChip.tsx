"use client";

import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CitationChipProps {
  title: string;
  source?: string;
  confidence?: number;
  url?: string;
  className?: string;
}

export function CitationChip({
  title,
  source = "WHO Model Formulary",
  confidence,
  url,
  className,
}: CitationChipProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/60 transition-colors text-xs text-foreground select-none group",
        className
      )}
    >
      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="font-semibold text-foreground/90 truncate max-w-[200px]" title={title}>
        {title}
      </span>
      <span className="text-[10px] text-muted-foreground font-mono">({source})</span>
      {confidence !== undefined && (
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold",
            confidence >= 0.75
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : confidence >= 0.5
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          )}
        >
          {Math.round(confidence * 100)}% match
        </span>
      )}
      {url && <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0" />}
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}
