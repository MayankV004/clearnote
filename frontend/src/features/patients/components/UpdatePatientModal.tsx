"use client";

import { useState } from "react";
import { useUpdatePatient } from "../api/useUpdatePatient";
import type { Patient, UpdatePatientPayload } from "../types";

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
      // Error is already captured in mutationError from useMutation
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Patient Profile</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Full Name *
            </label>
            <input
              required
              type="text"
              name="name"
              id="name"
              defaultValue={patient.name}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={patient.email || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              defaultValue={patient.phone || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label htmlFor="dob" className="mb-1 block text-sm font-medium text-slate-700">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              id="dob"
              defaultValue={patient.dob ? patient.dob.split("T")[0] : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="age" className="mb-1 block text-sm font-medium text-slate-700">
                Age
              </label>
              <input
                type="number"
                name="age"
                id="age"
                defaultValue={patient.age ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. 35"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="height" className="mb-1 block text-sm font-medium text-slate-700">
                Height
              </label>
              <input
                type="text"
                name="height"
                id="height"
                defaultValue={patient.height ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. 175 cm"
              />
            </div>
            <div>
              <label htmlFor="weight" className="mb-1 block text-sm font-medium text-slate-700">
                Weight
              </label>
              <input
                type="text"
                name="weight"
                id="weight"
                defaultValue={patient.weight ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. 70 kg"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
