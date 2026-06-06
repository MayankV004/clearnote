"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import PatientList from "./components/PatientList";
import CreatePatientModal from "./components/CreatePatientModal";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePatientCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header section */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-sm">
              CN
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">ClearNote</h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pt-10">
        {/* Welcome Banner */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-teal-600 mb-1">
              Doctor Dashboard
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              {isLoaded && user ? `Welcome, Dr. ${user.lastName || user.firstName || "Doctor"}` : "Welcome"}
            </h2>
            <p className="mt-2 text-slate-500 max-w-xl">
              Manage your patients, view consultation history, and generate structured SOAP notes from your voice recordings.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Patient Record
          </button>
        </section>

        {/* Patient List Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Your Patients</h3>
            <div className="text-sm text-slate-500">
              Updated just now
            </div>
          </div>
          
          <PatientList refreshTrigger={refreshTrigger} />
        </section>
      </div>

      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePatientCreated}
      />
    </main>
  );
}