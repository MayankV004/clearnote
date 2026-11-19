"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "destructive" | "success" | "ai";
  title?: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

export function Banner({
  variant = "info",
  title,
  onDismiss,
  action,
  children,
  className,
  ...props
}: BannerProps) {
  const Icon =
    variant === "destructive"
      ? AlertCircle
      : variant === "warning"
      ? AlertTriangle
      : variant === "success"
      ? CheckCircle2
      : Info;

  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border text-sm transition-colors",
        variant === "info" && "bg-muted/60 border-border text-foreground",
        variant === "warning" && "bg-warning-subtle/80 border-warning/40 text-amber-950 dark:text-amber-100",
        variant === "destructive" && "bg-destructive/10 border-destructive/30 text-rose-950 dark:text-rose-100",
        variant === "success" && "bg-success-subtle/80 border-success/40 text-emerald-950 dark:text-emerald-100",
        variant === "ai" && "bg-ai-subtle/60 border-ai-border text-indigo-950 dark:text-indigo-100",
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          "w-4 h-4 shrink-0 mt-0.5",
          variant === "info" && "text-muted-foreground",
          variant === "warning" && "text-warning",
          variant === "destructive" && "text-destructive",
          variant === "success" && "text-success",
          variant === "ai" && "text-ai"
        )}
      />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-xs uppercase tracking-wide mb-0.5">{title}</p>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
