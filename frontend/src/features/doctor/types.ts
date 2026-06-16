/**
 * features/doctor/types.ts
 *
 * Single source of truth for all Doctor-related TypeScript types.
 */

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  speciality: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  years_of_experience: number | null;
  license_no: string | null;
  bio: string | null;
  is_onboarded: boolean;
}
