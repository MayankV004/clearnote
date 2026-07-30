"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus, Mic } from "lucide-react";
import Image from "next/image";

interface DashboardNavbarProps {
  onAddPatient: () => void;
}

/**
 * Sticky top navigation bar for the dashboard.
 * Pure UI — receives action callbacks via props.
 */
export function DashboardNavbar({ onAddPatient }: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-screen-2xl px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ClearNote Logo" width={40} height={40} className="drop-shadow-md" />
          <span className="text-xl font-bold tracking-tight text-slate-900 text-brand-teal">ClearNote</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            disabled
            title="Coming soon"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-400 cursor-not-allowed"
          >
            <Mic className="w-4 h-4" />
            Record Session
          </button>
          <button
            onClick={onAddPatient}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </button>
          <UserButton
            appearance={{ elements: { avatarBox: "h-9 w-9 border border-slate-200" } }}
          />
        </div>
      </div>
    </header>
  );
}
