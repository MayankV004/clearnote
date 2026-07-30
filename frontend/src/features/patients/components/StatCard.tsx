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
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(8,145,178,0.1)] transition-all duration-300 hover:-translate-y-1 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900 drop-shadow-sm">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── StatCardSkeleton ─────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-3xl p-6 shadow-sm flex items-start gap-4">
      <SkeletonCircle className="w-12 h-12 rounded-2xl flex-shrink-0" />
      <div className="space-y-2 flex-1 pt-1">
        <SkeletonBox className="h-3 w-20" />
        <SkeletonBox className="h-8 w-14" />
        <SkeletonBox className="h-3 w-24" />
      </div>
    </div>
  );
}
