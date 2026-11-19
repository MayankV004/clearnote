"use client";

import React from "react";
import { Plus, Mic, Settings, Search } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  onAddPatient: () => void;
  onSelectPatient: () => void;
}

export function QuickActions({ onAddPatient, onSelectPatient }: QuickActionsProps) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono mb-3">
        Clinical Shortcuts
      </h3>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onAddPatient}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Add New Patient</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card/80 border border-primary/20 text-primary">
            N
          </kbd>
        </button>

        <button
          type="button"
          onClick={onSelectPatient}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Mic className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
            <span>Record Encounter</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">
            R
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            );
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
            <span>Command Palette</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/dashboard/settings"
          className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
            <span>Practice Settings</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Setup</span>
        </Link>
      </div>
    </div>
  );
}
