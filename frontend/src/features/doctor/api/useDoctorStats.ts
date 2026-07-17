"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export interface DoctorStats {
  total_patients: number;
  new_patients_this_month: number;
  total_consultations: number;
  total_soap_notes: number;
}

export function useDoctorStats() {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<DoctorStats>({
    queryKey: ["doctor", "stats"],
    queryFn: () => api.get<DoctorStats>("/doctors/me/stats"),
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
