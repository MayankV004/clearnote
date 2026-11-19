"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

interface PrescriptionResponse {
  url: string;
  token?: string;
  share_url?: string;
}

export function useGeneratePrescription() {
  const api = useApiClient();

  return useMutation({
    mutationFn: (consultationId: string) =>
      api.post<PrescriptionResponse>(`/consultations/${consultationId}/prescription`, {}),
  });
}

export function usePrescription(consultationId: string | null) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<PrescriptionResponse>({
    queryKey: ["prescription", consultationId],
    queryFn: () => api.get<PrescriptionResponse>(`/consultations/${consultationId}/prescription`),
    enabled: !!isSignedIn && !!consultationId,
    retry: false,
  });
}
