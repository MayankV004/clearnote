"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { QuickActions } from "./components/QuickActions";
import { DashboardStats } from "@/features/patients/components/DashboardStats";
import { DoctorProfileCard } from "@/features/doctor/components/DoctorProfileCard";
import PatientList from "@/features/patients/components/PatientList";
import CreatePatientModal from "@/features/patients/components/CreatePatientModal";
import SelectPatientModal from "@/features/patients/components/SelectPatientModal";
import type { Patient } from "@/features/patients/types";

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openSelectPatientModal = () => setIsSelectPatientModalOpen(true);
  const closeSelectPatientModal = () => setIsSelectPatientModalOpen(false);

  const handleSelectPatient = (patient: Patient) => {
    router.push(`/dashboard/patients/${patient.id}`);
  };

  // Keyboard shortcuts (N for new patient, R for record encounter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsModalOpen(true);
        }
      } else if (e.key === "r" || e.key === "R") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsSelectPatientModalOpen(true);
        }
      }
    };

    const handleCustomAdd = () => setIsModalOpen(true);
    const handleCustomRecord = () => setIsSelectPatientModalOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("clearnote:open-add-patient", handleCustomAdd);
    window.addEventListener("clearnote:open-record", handleCustomRecord);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("clearnote:open-add-patient", handleCustomAdd);
      window.removeEventListener("clearnote:open-record", handleCustomRecord);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Clinician Welcome Banner */}
      <WelcomeBanner />

      {/* 4-Card Daily Clinical Overview */}
      <DashboardStats />

      {/* Encounters Roster + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2/3 Column: Patient Roster */}
        <section className="lg:col-span-2 space-y-3" aria-label="Patient Encounters">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Patient Encounters & Roster
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Active charts, visit histories, and documentation status
              </p>
            </div>
          </div>

          <PatientList
            onAddPatient={openModal}
            onSelectPatient={handleSelectPatient}
          />
        </section>

        {/* Sidebar 1/3 Column */}
        <aside className="space-y-6" aria-label="Clinical Quick Actions & Profile">
          <QuickActions
            onAddPatient={openModal}
            onSelectPatient={openSelectPatientModal}
          />
          <DoctorProfileCard />
        </aside>
      </div>

      {/* Modals */}
      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={closeModal}
      />
      <SelectPatientModal
        isOpen={isSelectPatientModalOpen}
        onClose={closeSelectPatientModal}
      />
    </div>
  );
}
