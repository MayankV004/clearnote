"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePatientModal({ isOpen, onClose, onSuccess }: CreatePatientModalProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      dob: formData.get("dob") as string || null,
    };

    try {
      const token = await getToken();
      const res = await fetch(`${API}/patients/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Failed to create patient" }));
        throw new Error(body.detail ?? "Failed to create patient");
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">New Patient Record</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">
            {error}
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="+1 (555) 000-0000"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700"
            />
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
              disabled={loading}
              className="flex-1 rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
