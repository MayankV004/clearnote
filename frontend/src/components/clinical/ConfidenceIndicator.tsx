"use client";

import React from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfidenceIndicatorProps {
  score: number; // 0.0 to 1.0
  isUnverifiedInGuidelines?: boolean;
  compact?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  score,
  isUnverifiedInGuidelines = false,
  compact = false,
  className,
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(Math.min(Math.max(score, 0), 1) * 100);
  const isHigh = score >= 0.75;
  const isModerate = score >= 0.5 && score < 0.75;
  const isLow = score < 0.5;

  const colorClass = isHigh
    ? "bg-emerald-600 dark:bg-emerald-500"
    : isModerate
    ? "bg-amber-500 dark:bg-amber-400"
    : "bg-rose-500 dark:bg-rose-400";

  const textColorClass = isHigh
    ? "text-emerald-700 dark:text-emerald-400"
    : isModerate
    ? "text-amber-700 dark:text-amber-400"
    : "text-rose-700 dark:text-rose-400";

  const label = isHigh ? "High Confidence" : isModerate ? "Moderate Evidence" : "Low Evidence";

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-mono font-medium", textColorClass, className)}>
        <span className={cn("w-2 h-2 rounded-full", colorClass)} />
        <span>{percentage}%</span>
        {isUnverifiedInGuidelines && (
          <span className="text-[10px] text-muted-foreground">(Unverified in guidelines)</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5 w-full max-w-xs", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground flex items-center gap-1">
          {label}
          {isLow && <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />}
        </span>
        <span className={cn("font-mono font-bold", textColorClass)}>{percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isUnverifiedInGuidelines && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 shrink-0" />
          Unverified in local formularies (requires manual confirmation)
        </p>
      )}
    </div>
  );
}
