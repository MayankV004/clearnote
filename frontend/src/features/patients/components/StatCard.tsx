"use client";

import { SkeletonBox, SkeletonCircle } from "@/components/ui/Skeleton";

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── StatCardSkeleton ─────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <SkeletonCircle className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="space-y-2 flex-1 pt-0.5">
        <SkeletonBox className="h-3 w-20" />
        <SkeletonBox className="h-7 w-12" />
        <SkeletonBox className="h-3 w-24" />
      </div>
    </div>
  );
}
