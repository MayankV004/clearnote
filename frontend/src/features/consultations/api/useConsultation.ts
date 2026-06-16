"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Consultation } from "../types";

export function useConsultation(consultationId: string | null) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Consultation>({
    queryKey: ["consultation", consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    enabled: !!isSignedIn && !!consultationId,
    // Poll every 2 seconds if the backend is processing it
    refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PENDING" || status === "PROCESSING") return 2000;
        return false;
    },
    staleTime: 1000 * 60 * 5,
  });
}
