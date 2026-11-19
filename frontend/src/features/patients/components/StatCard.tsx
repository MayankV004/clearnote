"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { cn } from "@/lib/utils";

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  badge?: string;
  iconClassName?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  badge,
  iconClassName = "bg-primary/10 text-primary",
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0",
            iconClassName
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
          <AnimatedNumber value={value} />
        </span>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-xs)] bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
      </div>

      {sub && (
        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── StatCardSkeleton ─────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="w-8 h-8 rounded-[var(--radius-sm)]" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
