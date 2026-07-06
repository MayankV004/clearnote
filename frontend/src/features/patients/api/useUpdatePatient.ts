"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { UpdatePatientPayload, Patient } from "../types";
import { toast } from "sonner";

interface UpdatePatientVariables {
  patientId: string;
  payload: UpdatePatientPayload;
}

export function useUpdatePatient() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, UpdatePatientVariables>({
    mutationFn: ({ patientId, payload }) => api.patch<Patient>(`/patients/${patientId}`, payload),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients", patient.id] });
      toast.success(`Patient "${patient.name}" updated successfully.`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update patient. Please try again.");
    },
  });
}
