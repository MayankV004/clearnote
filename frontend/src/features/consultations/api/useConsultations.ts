"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Consultation } from "../types";

export function useConsultations(patientId: string, page = 1, pageSize = 20) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Consultation[]>({
    queryKey: ["consultations", patientId, page, pageSize],
    queryFn: () => api.get<Consultation[]>(`/consultations/?patient_id=${patientId}&page=${page}&page_size=${pageSize}`),
    enabled: !!isSignedIn && !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
