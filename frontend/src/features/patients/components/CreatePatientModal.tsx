"use client";

import React, { useState } from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";
import { useCreatePatient } from "../api/useCreatePatient";
import type { CreatePatientPayload } from "../types";
import { Button } from "@/components/ui/Button";

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePatientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePatientModalProps) {
  const { mutateAsync, isPending, error: mutationError } = useCreatePatient();
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const errorMessage =
    formError ?? (mutationError instanceof Error ? mutationError.message : null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const payload: CreatePatientPayload = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      dob: (formData.get("dob") as string) || null,
      age: formData.get("age") ? parseInt(formData.get("age") as string, 10) : null,
      height: (formData.get("height") as string) || null,
      weight: (formData.get("weight") as string) || null,
    };

    try {
      await mutateAsync(payload);
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
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">New Patient Record</h2>
              <p className="text-[11px] text-muted-foreground font-mono">Create electronic health chart</p>
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
              type="text"
              name="name"
              id="name"
              className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="+1 555-0199"
              />
            </div>
            <div>
              <label htmlFor="dob" className="mb-1 block text-xs font-semibold text-foreground">
                Date of Birth
              </label>
              <input
                type="date"
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
              name="email"
              id="email"
              className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              placeholder="patient@example.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="age" className="mb-1 block text-xs font-semibold text-foreground">
                Age
              </label>
              <input
                type="number"
                name="age"
                id="age"
                min="0"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="42"
              />
            </div>
            <div>
              <label htmlFor="height" className="mb-1 block text-xs font-semibold text-foreground">
                Height
              </label>
              <input
                type="text"
                name="height"
                id="height"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="175 cm"
              />
            </div>
            <div>
              <label htmlFor="weight" className="mb-1 block text-xs font-semibold text-foreground">
                Weight
              </label>
              <input
                type="text"
                name="weight"
                id="weight"
                className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="72 kg"
              />
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Create Patient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
