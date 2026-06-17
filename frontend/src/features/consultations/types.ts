export interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  rag_checked: boolean;
  rag_verdict: string | null;
}

export interface Diagnosis {
  id: string;
  icd_code: string | null;
  description: string;
}

export interface SOAPNote {
  id: string;
  consultation_id: string;
  raw_transcript: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  edited_by_doctor: boolean;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  audio_s3_key: string | null;
  duration_seconds: number | null;
  processing_error: string | null;
  created_at: string;
  soap_note: SOAPNote | null;
  medications: Medication[];
  diagnoses: Diagnosis[];
}

export interface CreateConsultationPayload {
  patient_id: string;
}
