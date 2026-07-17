"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Layout components
import { DashboardNavbar } from "./components/DashboardNavbar";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { QuickActions } from "./components/QuickActions";
// Feature components
import { DashboardStats } from "@/features/patients/components/DashboardStats";
import { DoctorProfileCard } from "@/features/doctor/components/DoctorProfileCard";
import PatientList from "@/features/patients/components/PatientList";
import CreatePatientModal from "@/features/patients/components/CreatePatientModal";
import SelectPatientModal from "@/features/patients/components/SelectPatientModal";
import { usePatients } from "@/features/patients/api/usePatients";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);
  const { data: patients, isLoading } = usePatients();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openSelectPatientModal = () => setIsSelectPatientModalOpen(true);
  const closeSelectPatientModal = () => setIsSelectPatientModalOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30">

      <DashboardNavbar onAddPatient={openModal} />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Greeting + date + doctor badge */}
        <WelcomeBanner />

        {/* 4-card stats row */}
        <DashboardStats />

        {/* Main content: patient list + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient list — 2/3 width */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Patients</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLoading ? "Loading..." : `${patients?.length ?? 0} total`}
                  </p>
                </div>
                <Link
                  href="#"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <PatientList onAddPatient={openModal} />
            </div>
          </section>

          {/* Sidebar — 1/3 width */}
          <aside className="space-y-5">
            <QuickActions onAddPatient={openModal} onSelectPatient={openSelectPatientModal} />
            <DoctorProfileCard />
          </aside>

        </div>
      </main>

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