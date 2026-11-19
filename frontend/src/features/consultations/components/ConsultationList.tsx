"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ChevronRight, Clock, Stethoscope } from "lucide-react";
import { useConsultations } from "../api/useConsultations";
import { formatDate, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";

export function ConsultationList({
  patientId,
  onStartConsultation,
}: {
  patientId: string;
  onStartConsultation?: () => void;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { data, isLoading, isError, error, refetch } = useConsultations(
    patientId,
    page,
    pageSize
  );

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-[var(--radius-sm)] border border-border/60 bg-muted/20 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs">
        <ErrorState
          title="Failed to Load Consultation Records"
          message={error?.message || "Unable to retrieve past encounters from database."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-6 shadow-xs">
        <EmptyState
          icon={Stethoscope}
          title="No Consultations Recorded"
          description="Record your first clinical visit with this patient. ClearNote will automatically transcribe the encounter and generate structured SOAP documentation."
          action={
            onStartConsultation
              ? {
                  label: "Start First Visit",
                  onClick: onStartConsultation,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Clinical Encounter History
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {data.length} recorded consultation{data.length === 1 ? "" : "s"} on file
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((consultation) => {
          const hasReview =
            consultation.status === "COMPLETE" ||
            consultation.status === "AWAITING_REVIEW";

          return (
            <div
              key={consultation.id}
              onClick={() => {
                if (hasReview) {
                  router.push(`/dashboard/consultations/${consultation.id}`);
                }
              }}
              className={`p-3.5 rounded-[var(--radius-sm)] border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all group ${
                hasReview ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {formatDate(consultation.created_at)}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ENC-{consultation.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {timeAgo(consultation.created_at)}
                    {consultation.duration_seconds && (
                      <>
                        <span>•</span>
                        <span>
                          {Math.floor(consultation.duration_seconds / 60)}m{" "}
                          {consultation.duration_seconds % 60}s duration
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {consultation.status === "COMPLETE" && (
                    <Badge variant="success" size="sm" dot>
                      Approved & Signed
                    </Badge>
                  )}
                  {consultation.status === "AWAITING_REVIEW" && (
                    <Badge variant="warning" size="sm" dot>
                      Awaiting Review
                    </Badge>
                  )}
                  {consultation.status === "PROCESSING" && (
                    <Badge variant="primary" size="sm">
                      Extracting Notes...
                    </Badge>
                  )}
                  {consultation.status === "FAILED" && (
                    <Badge variant="destructive" size="sm">
                      Processing Failed
                    </Badge>
                  )}
                  {consultation.status === "PENDING" && (
                    <Badge variant="default" size="sm">
                      Draft Session
                    </Badge>
                  )}

                  {hasReview && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {(page > 1 || data.length === pageSize) && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-muted-foreground font-mono text-[11px]">
            Page {page}
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < pageSize}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
