"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { Consultation } from "../types";
import { toast } from "sonner";

export interface ConsultationUpdatePayload {
  soap_note?: {
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  } | null;
  medications?: {
    id?: string | null;
    name: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    route?: string | null;
  }[] | null;
  diagnoses?: {
    id?: string | null;
    icd_code?: string | null;
    description: string;
  }[] | null;
}

export function useUpdateConsultation(consultationId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConsultationUpdatePayload) =>
      api.patch<Consultation>(`/consultations/${consultationId}`, data),
    onSuccess: (updatedConsultation) => {
      // Invalidate the consultation query to force a refetch or optimistically update
      queryClient.invalidateQueries({
        queryKey: ["consultation", consultationId],
      });
      // Optionally update the cache directly for snappier UI
      queryClient.setQueryData(["consultation", consultationId], updatedConsultation);
      toast.success("Consultation updated successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save changes. Please try again.");
    },
  });
}
