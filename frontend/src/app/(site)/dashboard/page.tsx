"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { animate, createScope, stagger } from "animejs";

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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scope = useRef<any>(null);

  useEffect(() => {
    scope.current = createScope({ root: containerRef }).add(() => {
      animate('.dash-anim-item', {
        translateY: [20, 0],
        opacity: [0, 1],
        ease: 'outQuart',
        duration: 600,
        delay: stagger(100)
      });
    });

    return () => {
      if (scope.current) scope.current.revert();
    };
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openSelectPatientModal = () => setIsSelectPatientModalOpen(true);
  const closeSelectPatientModal = () => setIsSelectPatientModalOpen(false);

  return (
    <div className="min-h-screen bg-white/20 text-slate-900 selection:bg-white0/30 relative">
      {/* Background elements */}
      
      

      <DashboardNavbar onAddPatient={openModal} />

      <main ref={containerRef} className="mx-auto max-w-screen-2xl px-6 py-8 space-y-8 relative z-10">

        {/* Greeting + date + doctor badge */}
        <div className="dash-anim-item opacity-0">
          <WelcomeBanner />
        </div>

        {/* 4-card stats row */}
        <div className="dash-anim-item opacity-0">
          <DashboardStats />
        </div>

        {/* Main content: patient list + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient list — 2/3 width */}
          <section className="lg:col-span-2 dash-anim-item opacity-0">
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(8,145,178,0.1)] overflow-hidden transition-shadow duration-300">
              <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-100/50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Patients</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLoading ? "Loading..." : `${patients?.length ?? 0} total`}
                  </p>
                </div>
                <Link
                  href="#"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <PatientList onAddPatient={openModal} />
            </div>
          </section>

          {/* Sidebar — 1/3 width */}
          <aside className="space-y-6">
            <div className="dash-anim-item opacity-0">
              <QuickActions onAddPatient={openModal} onSelectPatient={openSelectPatientModal} />
            </div>
            <div className="dash-anim-item opacity-0">
              <DoctorProfileCard />
            </div>
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