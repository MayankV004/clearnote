"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

interface AudioResponse {
  url: string;
}

export function useConsultationAudio(consultationId: string | null) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<AudioResponse>({
    queryKey: ["consultation-audio", consultationId],
    queryFn: () => api.get<AudioResponse>(`/consultations/${consultationId}/audio`),
    enabled: !!isSignedIn && !!consultationId,
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 minutes presigned URL freshness
  });
}
