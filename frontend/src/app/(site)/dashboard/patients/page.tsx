"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ChevronRight,
  Layers,
  ArrowRight,
} from "lucide-react";
import { usePatients } from "@/features/patients/api/usePatients";
import type { Patient } from "@/features/patients/types";
import { Table, Column } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import CreatePatientModal from "@/features/patients/components/CreatePatientModal";
import { formatDate, timeAgo } from "@/lib/utils";

export default function AllPatientsPage() {
  const router = useRouter();
  const page = 1;
  const pageSize = 15;
  const { data: patients, isLoading, isError, error, refetch } = usePatients(page, pageSize);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [consentFilter, setConsentFilter] = useState<"all" | "consented" | "pending">("all");
  const [isDense, setIsDense] = useState(false);

  // Filter patients by search query and consent status
  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    let list = [...patients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
      );
    }

    if (consentFilter === "consented") {
      list = list.filter((p) => !!p.consent_given_at);
    } else if (consentFilter === "pending") {
      list = list.filter((p) => !p.consent_given_at);
    }

    return list;
  }, [patients, searchQuery, consentFilter]);

  // Global hotkey 'N' for new patient
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "Patient / Chart",
      sortable: true,
      render: (patient) => (
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} size="sm" />
          <div className="min-w-0">
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors hover:underline block truncate"
            >
              {patient.name}
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground block truncate">
              MRN: {patient.id.slice(0, 10).toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "age",
      header: "Age & DOB",
      sortable: true,
      render: (patient) => (
        <div className="text-xs font-mono">
          <span className="text-foreground">{patient.age} yrs</span>
          <span className="text-muted-foreground block text-[11px]">
            {patient.dob ? formatDate(patient.dob) : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact Details",
      render: (patient) => (
        <div className="text-xs">
          <span className="text-foreground font-mono block">
            {patient.phone || "No phone listed"}
          </span>
          <span className="text-muted-foreground text-[11px] truncate block max-w-[180px]">
            {patient.email || "No email listed"}
          </span>
        </div>
      ),
    },
    {
      key: "consent",
      header: "HIPAA Recording Consent",
      render: (patient) =>
        patient.consent_given_at ? (
          <Badge
            variant="outline"
            size="sm"
            className="text-teal-700 dark:text-teal-300 border-teal-500/30 bg-teal-500/10 font-mono text-[10px]"
          >
            <ShieldCheck className="w-3 h-3 mr-1 inline" /> Consented
          </Badge>
        ) : (
          <Badge
            variant="outline"
            size="sm"
            className="text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10 font-mono text-[10px]"
          >
            Pending Consent
          </Badge>
        ),
    },
    {
      key: "created_at",
      header: "Enrolled",
      sortable: true,
      render: (patient) => (
        <div className="text-xs text-muted-foreground font-mono">
          <span>{timeAgo(patient.created_at)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      render: (patient) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          className="text-xs h-7 px-2.5"
        >
          View Chart
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground">Patients</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Patient Directory & Medical Records
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {filteredPatients.length} Active Charts
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage comprehensive clinical records, verify HIPAA recording consents, and review longitudinal consultation histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            size="md"
          >
            Register Patient
          </Button>
        </div>
      </div>

      {/* Search, Filter, and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone, email, or MRN..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs transition-colors"
          />
        </div>

        {/* Filters and Dense Mode Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-card border border-border rounded-[var(--radius-sm)] p-0.5 text-xs">
            <button
              onClick={() => setConsentFilter("all")}
              className={`px-2.5 py-1 rounded-[var(--radius-xs)] font-medium transition-colors ${
                consentFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setConsentFilter("consented")}
              className={`px-2.5 py-1 rounded-[var(--radius-xs)] font-medium transition-colors ${
                consentFilter === "consented"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Consented
            </button>
            <button
              onClick={() => setConsentFilter("pending")}
              className={`px-2.5 py-1 rounded-[var(--radius-xs)] font-medium transition-colors ${
                consentFilter === "pending"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending
            </button>
          </div>

          <button
            onClick={() => setIsDense(!isDense)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs font-medium transition-colors ${
              isDense
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dense Mode</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load patient records"
          message={error instanceof Error ? error.message : "Unable to retrieve clinical patient directory."}
          onRetry={() => refetch()}
        />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? "No matching patient records found" : "No patients registered yet"}
          description={
            searchQuery
              ? `No patient records match the query "${searchQuery}". Check the MRN spelling or clear active filters.`
              : "Register your first patient chart to begin recording ambient clinical consultations and managing SOAP notes."
          }
          action={{
            label: "Register New Patient",
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block">
            <Table
              data={filteredPatients}
              columns={columns}
              keyExtractor={(patient) => patient.id}
              dense={isDense}
            />
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 rounded-[var(--radius-md)] border border-border bg-card shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={patient.name} size="md" />
                    <div>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="font-bold text-sm text-foreground hover:underline"
                      >
                        {patient.name}
                      </Link>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        MRN: {patient.id.slice(0, 10).toUpperCase()} • {patient.age} yrs
                      </p>
                    </div>
                  </div>
                  {patient.consent_given_at ? (
                    <Badge variant="outline" size="sm" className="text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px]">
                      Consented
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm" className="text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground font-mono">
                    Enrolled {timeAgo(patient.created_at)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open Chart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <CreatePatientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
