"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { Consultation, CreateConsultationPayload } from "../types";

export function useCreateConsultation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<Consultation, Error, CreateConsultationPayload>({
    mutationFn: (payload) => api.post<Consultation>("/consultations/", payload),
    onSuccess: (newConsultation) => {
      queryClient.invalidateQueries({
        queryKey: ["consultations", newConsultation.patient_id],
      });
    },
  });
}
