"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { Patient } from "../types";

/**
 * Fetches the full list of patients for the currently authenticated doctor.
 *
 * Cache behavior:
 *  - staleTime: 5 minutes — navigating back to the dashboard within 5 minutes
 *    will show the cached list instantly with no loading spinner.
 *  - Automatically refreshed when `useCreatePatient` mutation invalidates
 *    the ["patients"] query key.
 */
export function usePatients(page = 1, pageSize = 50) {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<Patient[]>({
    queryKey: ["patients", page, pageSize],
    queryFn: () => api.get<Patient[]>(`/patients/?page=${page}&page_size=${pageSize}`),
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
