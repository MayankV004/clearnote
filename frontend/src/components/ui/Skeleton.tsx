"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-[var(--radius-xs)]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** A rectangular pulsing placeholder. Pass width/height via className. */
export function SkeletonBox({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-[var(--radius-xs)]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** A circular pulsing placeholder. Pass size via className. */
export function SkeletonCircle({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-full", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
