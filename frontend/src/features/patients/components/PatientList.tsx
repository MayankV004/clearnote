"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Mic,
  ChevronRight,
  Filter,
  Clock,
  Layers,
} from "lucide-react";
import { usePatients } from "../api/usePatients";
import type { Patient } from "../types";
import { Table, Column } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { formatDate, timeAgo } from "@/lib/utils";

interface PatientListProps {
  onAddPatient: () => void;
  onSelectPatient?: (patient: Patient) => void;
}

export default function PatientList({
  onAddPatient,
  onSelectPatient,
}: PatientListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: patients, isLoading, isError, error, refetch } = usePatients(page, pageSize);

  const [searchQuery, setSearchQuery] = useState("");
  const [consentFilter, setConsentFilter] = useState<"all" | "consented" | "pending">("all");
  const [isDense, setIsDense] = useState(false);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
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
      list = list.filter((p) => Boolean(p.consent_given_at));
    } else if (consentFilter === "pending") {
      list = list.filter((p) => !p.consent_given_at);
    }

    list.sort((a, b) => {
      if (sortKey === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortKey === "created_at") {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [patients, searchQuery, consentFilter, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns: Column<Patient & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Patient",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <Link
              href={`/dashboard/patients/${row.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors hover:underline block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {row.name}
            </Link>
            <span className="text-[10px] font-mono text-muted-foreground block truncate">
              MRN: {row.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "demographics",
      header: "Demographics",
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono text-foreground">
            {row.age != null ? `${row.age} yrs` : row.dob ? formatDate(row.dob) : "—"}
          </span>
          {row.dob && row.age != null && (
            <span className="text-[10px] text-muted-foreground block font-mono">
              DOB: {formatDate(row.dob)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Details",
      render: (row) => (
        <div className="text-xs min-w-0">
          <span className="text-foreground block font-mono truncate">
            {row.phone || "—"}
          </span>
          {row.email && (
            <span className="text-[10px] text-muted-foreground block truncate font-mono">
              {row.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "consent",
      header: "HIPAA Status",
      render: (row) =>
        row.consent_given_at ? (
          <Badge variant="primary" size="sm" dot>
            Consented
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        ),
    },
    {
      key: "created_at",
      header: "Registered",
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="text-foreground block font-mono">
            {formatDate(row.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onSelectPatient && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSelectPatient(row)}
              className="text-xs"
              title="Record Consultation"
            >
              <Mic className="w-3 h-3 mr-1 text-primary" />
              Record
            </Button>
          )}
          <Link
            href={`/dashboard/patients/${row.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors"
          >
            Chart
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </Link>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 sm:p-6 bg-card border border-border rounded-[var(--radius-md)]">
        <ErrorState
          title="Failed to Load Clinical Roster"
          message={error instanceof Error ? error.message : "Unable to retrieve patient roster from database."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster by patient name, phone, or MRN..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search patient roster"
          />
        </div>

        {/* Filter Controls & Dense Mode */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1 border border-border rounded-[var(--radius-sm)] p-0.5 bg-muted/40">
            <Filter className="w-3 h-3 text-muted-foreground ml-1.5 mr-0.5" />
            <select
              value={consentFilter}
              onChange={(e) =>
                setConsentFilter(e.target.value as "all" | "consented" | "pending")
              }
              className="h-6 text-xs bg-transparent text-foreground border-none focus:outline-none cursor-pointer pr-1"
              aria-label="Filter by HIPAA consent status"
            >
              <option value="all">All Patients</option>
              <option value="consented">Consented</option>
              <option value="pending">Pending Consent</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsDense(!isDense)}
            className={`p-1.5 rounded-[var(--radius-sm)] border text-xs transition-colors ${
              isDense
                ? "bg-accent text-accent-foreground border-border"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Toggle compact table density"
            aria-label="Toggle compact view"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <Button size="xs" onClick={onAddPatient} className="text-xs">
            <Plus className="w-3 h-3 mr-1" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Main Table / Skeletons / Empty */}
      {isLoading ? (
        <Table
          columns={columns}
          data={[]}
          keyExtractor={(row) => row.id}
          isLoading={true}
          dense={isDense}
        />
      ) : filteredPatients.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={searchQuery || consentFilter !== "all" ? "No Matching Patients" : "No Patients Enrolled Yet"}
            description={
              searchQuery || consentFilter !== "all"
                ? "Try adjusting your search criteria or clearing active filters to view other patient charts."
                : "Your practice roster is currently empty. Register your first patient to begin documenting consultations."
            }
            action={
              searchQuery || consentFilter !== "all"
                ? {
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchQuery("");
                      setConsentFilter("all");
                    },
                  }
                : {
                    label: "Add First Patient",
                    onClick: onAddPatient,
                  }
            }
          />
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredPatients as (Patient & Record<string, unknown>)[]}
          keyExtractor={(row) => row.id}
          sortColumn={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          dense={isDense}
          onRowClick={(row) => router.push(`/dashboard/patients/${row.id}`)}
        />
      )}

      {/* Pagination Footer */}
      {!isLoading && (patients?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card/60 text-xs text-muted-foreground">
          <span className="font-mono text-[11px]">
            Showing {filteredPatients.length} patient record{filteredPatients.length === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="font-mono text-[11px] px-1">Page {page}</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => p + 1)}
              disabled={(patients?.length ?? 0) < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
