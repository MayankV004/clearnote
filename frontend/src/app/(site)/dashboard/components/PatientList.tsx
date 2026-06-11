"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
}

interface PatientListProps {
  refreshTrigger: number;
}

export default function PatientList({ refreshTrigger }: PatientListProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function fetchPatients() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API}/patients/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Failed to fetch patients" }));
          throw new Error(body.detail ?? "Failed to fetch patients");
        }

        const data = await res.json();
        setPatients(data);
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

    fetchPatients();
  }, [isLoaded, isSignedIn, getToken, refreshTrigger]);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <p className="animate-pulse font-medium text-slate-400">Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 shadow-sm p-6 text-center">
        <div>
          <p className="font-semibold text-rose-700">Error loading patients</p>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">No patients yet</h3>
        <p className="mt-2 max-w-sm text-slate-500">
          Your patient list is empty. Click the button above to create your first patient record and start taking notes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {patients.map((patient) => (
          <li key={patient.id} className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                  {patient.email && <span>{patient.email}</span>}
                  {patient.email && patient.phone && <span className="h-1 w-1 rounded-full bg-slate-300"></span>}
                  {patient.phone && <span>{patient.phone}</span>}
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700"
            >
              View Profile
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
