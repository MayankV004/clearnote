"use client";

import React from "react";
import { Stethoscope, ShieldCheck, MapPin, Phone } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDoctor } from "../api/useDoctor";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DoctorProfileCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-3">
      <Skeleton className="h-3 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2 pt-1 border-t border-border/60">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// ─── DoctorProfileCard ────────────────────────────────────────────────────────

export function DoctorProfileCard() {
  const { user } = useUser();
  const { data: doctor, isLoading } = useDoctor();

  if (isLoading) return <DoctorProfileCardSkeleton />;
  if (!doctor) return null;

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          Attending Clinician
        </h3>
        <Badge variant="primary" size="sm" dot>
          Verified
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Avatar
          name={doctor.name || user?.fullName || "Doctor"}
          src={user?.imageUrl}
          size="md"
        />
        <div className="min-w-0">
          <p className="font-bold text-foreground text-xs truncate">
            {doctor.name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {doctor.speciality ?? "General Practice"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px] pt-2 border-t border-border/60 text-muted-foreground">
        {doctor.clinic_name && (
          <div className="flex items-center gap-2 truncate">
            <Stethoscope className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{doctor.clinic_name}</span>
          </div>
        )}
        {doctor.clinic_address && (
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{doctor.clinic_address}</span>
          </div>
        )}
        {doctor.clinic_phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>{doctor.clinic_phone}</span>
          </div>
        )}
        {doctor.license_no && (
          <div className="flex items-center gap-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>License: {doctor.license_no}</span>
          </div>
        )}
      </div>
    </div>
  );
}
