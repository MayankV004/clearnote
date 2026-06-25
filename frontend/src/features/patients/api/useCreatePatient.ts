"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import type { CreatePatientPayload, Patient } from "../types";
import { toast } from "sonner";

/**
 * Mutation hook for creating a new patient record.
 *
 * On success:
 *  - Invalidates the ["patients"] query, triggering a background refetch
 *    of the patient list. This replaces the old `refreshTrigger` counter hack.
 *  - The new patient is immediately visible in the list without a manual reload.
 */
export function useCreatePatient() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, CreatePatientPayload>({
    mutationFn: (payload) => api.post<Patient>("/patients/", payload),
    onSuccess: (patient) => {
      // Invalidate the patient list so it refetches with the new patient included.
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(`Patient "${patient.name}" added successfully.`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create patient. Please try again.");
    },
  });
}
