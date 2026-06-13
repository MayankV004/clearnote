/**
 * features/patients/types.ts
 *
 * Single source of truth for all Patient-related TypeScript types.
 * Removes the duplicate interfaces previously defined in dashboard/page.tsx
 * and patients/[id]/page.tsx.
 */

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
  consent_given_at: string | null;
  consent_version: string | null;
}

export interface CreatePatientPayload {
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
}
