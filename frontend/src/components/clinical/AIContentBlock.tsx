"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface AIContentBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "draft" | "verified";
  title?: string;
  sourceModel?: string;
  timestamp?: string;
  children: React.ReactNode;
}

export function AIContentBlock({
  status = "draft",
  title,
  sourceModel = "Llama 3.3 70B",
  timestamp,
  children,
  className,
  ...props
}: AIContentBlockProps) {
  const isVerified = status === "verified";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border p-4 transition-colors",
        isVerified
          ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10"
          : "border-ai-border/70 bg-ai-subtle/20 dark:border-ai-border/40 dark:bg-ai-subtle/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-border/50 text-xs">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge variant="success" size="sm" dot>
              Clinician Verified
            </Badge>
          ) : (
            <Badge variant="ai" size="sm" dot>
              AI Drafted
            </Badge>
          )}
          {title && <span className="font-semibold text-foreground">{title}</span>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
          <span>{sourceModel}</span>
          {timestamp && <span>• {timestamp}</span>}
        </div>
      </div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}
