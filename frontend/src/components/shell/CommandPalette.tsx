"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Settings,
  Stethoscope,
  UserPlus,
  Moon,
  Sun,
  Code2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  category: "Navigation" | "Actions" | "System";
  icon: React.ElementType;
  shortcut?: string;
  perform: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onAddPatient,
  onStartConsultation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient?: () => void;
  onStartConsultation?: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: "nav-dash",
      label: "Go to Clinical Dashboard",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G D",
      perform: () => {
        router.push("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-settings",
      label: "Doctor Profile & Settings",
      category: "Navigation",
      icon: Settings,
      shortcut: "G S",
      perform: () => {
        router.push("/dashboard/settings");
        onClose();
      },
    },
    {
      id: "act-consult",
      label: "Start New Patient Consultation",
      category: "Actions",
      icon: Stethoscope,
      shortcut: "R",
      perform: () => {
        onClose();
        if (onStartConsultation) {
          onStartConsultation();
        } else {
          window.dispatchEvent(new CustomEvent("clearnote:open-record"));
        }
      },
    },
    {
      id: "act-patient",
      label: "Register New Patient Record",
      category: "Actions",
      icon: UserPlus,
      shortcut: "N",
      perform: () => {
        onClose();
        if (onAddPatient) {
          onAddPatient();
        } else {
          window.dispatchEvent(new CustomEvent("clearnote:open-add-patient"));
        }
      },
    },
    {
      id: "theme-toggle",
      label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      category: "System",
      icon: theme === "dark" ? Sun : Moon,
      shortcut: "T",
      perform: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        onClose();
      },
    },
    {
      id: "dev-gallery",
      label: "Open Design System Component Gallery",
      category: "System",
      icon: Code2,
      shortcut: "G C",
      perform: () => {
        router.push("/dev/components");
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].perform();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg" className="p-0 overflow-hidden">
      <div className="flex items-center border-b border-border px-4 py-3 bg-card">
        <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-3" />
        <input
          autoFocus
          value={query}
          onChange={handleQueryChange}
          placeholder="Type a clinical command or search... (Esc to close)"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
          ESC
        </kbd>
      </div>

      <div className="max-h-72 overflow-y-auto p-2 divide-y divide-border/40">
        {filteredCommands.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No matching clinical commands found.
          </div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                type="button"
                onClick={cmd.perform}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] text-xs text-left transition-colors cursor-pointer",
                  isSelected ? "bg-accent text-accent-foreground font-semibold" : "text-foreground hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/80 text-muted-foreground border border-border/80">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
        <span>Clinical Command Palette</span>
        <div className="flex items-center gap-3">
          <span>Navigate: ↑ ↓</span>
          <span>Select: ↵</span>
        </div>
      </div>
    </Dialog>
  );
}
