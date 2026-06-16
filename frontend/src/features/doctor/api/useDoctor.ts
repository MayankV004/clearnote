"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import type { DoctorProfile } from "../types";

/**
 * Fetches the authenticated doctor's own profile from GET /doctors/me.
 *
 * Cache behavior:
 *  - staleTime: 10 minutes — doctor profile rarely changes during a session.
 *  - If the doctor updates their profile, call queryClient.invalidateQueries(["doctor", "me"])
 *    to force a refresh.
 */
export function useDoctor() {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<DoctorProfile>({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
