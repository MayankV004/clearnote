"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, X, Stethoscope } from "lucide-react";
import { usePatients } from "../api/usePatients";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface SelectPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectPatientModal({ isOpen, onClose }: SelectPatientModalProps) {
  const { data: patients, isLoading } = usePatients();
  const router = useRouter();
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredPatients =
    patients?.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
    ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-6 shadow-xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Select Patient for Visit</h2>
              <p className="text-[11px] text-muted-foreground font-mono">Launch recording encounter</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[var(--radius-xs)] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roster by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading patients...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No matching patient records found.
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/dashboard/patients/${patient.id}`);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={patient.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {patient.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {[patient.phone, patient.dob ? `DOB: ${patient.dob}` : null]
                        .filter(Boolean)
                        .join(" • ") || "No additional info"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5 flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
