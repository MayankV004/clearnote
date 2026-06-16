/**
 * features/doctor/validations.ts
 *
 * Zod validation schemas for doctor-related forms.
 * Moved from src/lib/validations/doctor.ts to keep the doctor feature cohesive.
 */

import { z } from "zod";

export const doctorOnboardingSchema = z.object({
  years_of_experience: z.number().min(0, "Must be a positive number"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio is too long"),
  clinic_name: z.string().min(2, "Clinic name is required"),
  clinic_address: z.string().min(5, "Please provide a full address"),
  clinic_phone: z.string().min(10, "Valid phone number required"),
  speciality: z.string().min(2, "Speciality is required"),
  license_no: z.string().min(4, "Valid license number required"),
});

export type DoctorOnboardingFormValues = z.infer<typeof doctorOnboardingSchema>;
