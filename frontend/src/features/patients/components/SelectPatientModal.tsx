"use client";

import { usePatients } from "../api/usePatients";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";

interface SelectPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectPatientModal({ isOpen, onClose }: SelectPatientModalProps) {
  const { data: patients, isLoading } = usePatients();
  const router = useRouter();
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredPatients = patients?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col max-h-[80vh]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Select Patient</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">No patients found.</div>
          ) : (
            filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => {
                  onClose();
                  router.push(`/dashboard/patients/${patient.id}`);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{patient.name}</p>
                    <p className="text-xs text-slate-500">
                      {patient.age ? `${patient.age} yrs` : "Age not set"} 
                      {patient.phone ? ` • ${patient.phone}` : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
