"use client";

/**
 * Skeleton primitive components for consistent shimmer loading states.
 * Use these as building blocks inside feature-level skeleton components.
 *
 * Usage:
 *   <SkeletonBox className="h-4 w-32 rounded" />
 *   <SkeletonCircle className="w-10 h-10" />
 */

interface SkeletonProps {
  className?: string;
}

/** A rectangular pulsing placeholder. Pass width/height via className. */
export function SkeletonBox({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** A circular pulsing placeholder. Pass size via className. */
export function SkeletonCircle({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200 animate-pulse rounded-full ${className}`}
      aria-hidden="true"
    />
  );
}
