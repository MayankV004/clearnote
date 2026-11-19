"use client";

import React from "react";
import { FolderX, AlertCircle, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderX,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-[var(--radius-lg)] border border-dashed border-border bg-card/50",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load clinical data",
  message = "A network error or service interruption occurred. Your recorded data is intact.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/5 text-destructive",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-destructive">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
}

export interface PermissionDeniedProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  className?: string;
}

export function PermissionDenied({
  title = "Access Restricted",
  message = "You do not have clinical authorization to view or edit this patient encounter under HIPAA tenant isolation.",
  onBack,
  className,
}: PermissionDeniedProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-[var(--radius-lg)] border border-border bg-card",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack}>
          Return to Patient Roster
        </Button>
      )}
    </div>
  );
}
