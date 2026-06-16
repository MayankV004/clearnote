"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Consultation } from "../types";

export function useConsultations(patientId: string) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Consultation[]>({
    queryKey: ["consultations", patientId],
    queryFn: () => api.get<Consultation[]>(`/consultations/?patient_id=${patientId}`),
    enabled: !!isSignedIn && !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
