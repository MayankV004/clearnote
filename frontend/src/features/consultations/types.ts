export interface SOAPNote {
  id: string;
  consultation_id: string;
  raw_transcript: string | null;
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
}

export interface CreateConsultationPayload {
  patient_id: string;
}
