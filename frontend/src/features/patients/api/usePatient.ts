"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Patient } from "../types";

/**
 * Fetches a single patient record by ID.
 *
 * Cache behavior:
 *  - queryKey includes the patient ID, so each patient gets its own cache entry.
 *  - If the patient list was already fetched by usePatients, navigating to the
 *    profile page often has data immediately via the shared query cache.
 *  - staleTime: 5 minutes
 */
export function usePatient(id: string | undefined) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Patient>({
    queryKey: ["patients", id],
    queryFn: () => api.get<Patient>(`/patients/${id}`),
    enabled: !!isSignedIn && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
