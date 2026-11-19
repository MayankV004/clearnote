"use client";

import React, { useState } from "react";
import { X, Pencil, AlertCircle } from "lucide-react";
import { useUpdatePatient } from "../api/useUpdatePatient";
import type { Patient, UpdatePatientPayload } from "../types";
import { Button } from "@/components/ui/Button";

interface UpdatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: () => void;
}

export default function UpdatePatientModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: UpdatePatientModalProps) {
  const { mutateAsync, isPending, error: mutationError } = useUpdatePatient();
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const errorMessage =
    formError ?? (mutationError instanceof Error ? mutationError.message : null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const payload: UpdatePatientPayload = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      dob: (formData.get("dob") as string) || null,
      age: formData.get("age") ? parseInt(formData.get("age") as string, 10) : null,
      height: (formData.get("height") as string) || null,
      weight: (formData.get("weight") as string) || null,
    };

    try {
      await mutateAsync({ patientId: patient.id, payload });
      onSuccess?.();
      onClose();
    } catch {
      // Error is captured in mutationError
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-card p-5 sm:p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary/10 text-primary flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Edit Patient Record</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                MRN: {patient.id.slice(0, 8).toUpperCase()}
              </p>
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

        {errorMessage && (
          <div className="mb-4 rounded-[var(--radius-sm)] bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold text-foreground">
              Full Legal Name <span className="text-destructive">*</span>
            </label>
            <input
              required
              defaultValue={patient.name}
              type="text"
              name="name"
              id="name"
              className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue={patient.phone || ""}
                name="phone"
                id="phone"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label htmlFor="dob" className="mb-1 block text-xs font-semibold text-foreground">
                Date of Birth
              </label>
              <input
                type="date"
                defaultValue={patient.dob || ""}
                name="dob"
                id="dob"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-foreground">
              Email Address
            </label>
            <input
              type="email"
              defaultValue={patient.email || ""}
              name="email"
              id="email"
              className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="age" className="mb-1 block text-xs font-semibold text-foreground">
                Age
              </label>
              <input
                type="number"
                defaultValue={patient.age || ""}
                name="age"
                id="age"
                min="0"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label htmlFor="height" className="mb-1 block text-xs font-semibold text-foreground">
                Height
              </label>
              <input
                type="text"
                defaultValue={patient.height || ""}
                name="height"
                id="height"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label htmlFor="weight" className="mb-1 block text-xs font-semibold text-foreground">
                Weight
              </label>
              <input
                type="text"
                defaultValue={patient.weight || ""}
                name="weight"
                id="weight"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
