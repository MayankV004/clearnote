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
    // Poll every 2 seconds while the backend is processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000; // keep polling until we get initial data
      if (data.status === "PENDING" || data.status === "PROCESSING") return 2000;
      return false; // stop polling once COMPLETE or FAILED
    },
    // Keep polling even if the browser tab loses focus
    refetchIntervalInBackground: true,
    // No staleTime — we always want the freshest status during polling
    staleTime: 0,
    // Don't retry on failure; the refetchInterval will handle retries naturally
    retry: false,
  });
}
