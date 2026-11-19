"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ClinicalAudioPlayer } from "@/features/consultations/components/ClinicalAudioPlayer";
import { SoapNoteEditor } from "@/features/consultations/components/SoapNoteEditor";
import { DrugInteractionBanner } from "@/features/consultations/components/DrugInteractionBanner";
import { ReviewStatusBar } from "@/components/clinical/ReviewStatusBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  FileAudio,
  FileText,
  Stethoscope,
  Pill,
  Edit2,
  Save,
  X,
  Share2,
  Copy,
  Check,
} from "lucide-react";

export default function DevConsultationReviewPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isCriticalAcked, setIsCriticalAcked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [soapValues, setSoapValues] = useState({
    subjective:
      "Patient is a 44-year-old male presenting with a productive cough (yellow-green sputum) and low-grade fever for 5 days. Reports dyspnea upon climbing two flights of stairs. Denies chest pain, hemoptysis, or sick contacts. Documented severe childhood anaphylaxis to Penicillin (generalized urticaria and respiratory distress).",
    objective:
      "Vitals: BP 128/82 mmHg, HR 78 bpm, Temp 100.4°F (oral), SpO2 97% on room air, RR 18/min.\nGeneral: Alert, conversational, mild coughing paroxysms.\nHEENT: Normocephalic, pharynx mildly erythematous without exudate.\nLungs: Bilateral coarse rhonchi in lower lung fields; no wheezing or stridor.\nCardiovascular: Regular rate and rhythm, S1/S2 normal, no murmurs.",
    assessment:
      "1. Acute Bronchitis (ICD-10 J20.9) - acute onset lower respiratory tract inflammation.\n2. Documented Severe Penicillin Anaphylaxis (ICD-10 Z88.0) - contraindicates beta-lactam class.",
    plan:
      "1. Azithromycin 500mg PO on Day 1, followed by 250mg PO once daily on Days 2-5.\n2. Guaifenesin 400mg PO every 4 hours PRN for sputum clearance.\n3. Increased oral hydration and rest.\n4. Strict return precautions if temperature exceeds 102°F or acute shortness of breath develops.",
  });

  const mockInteractions = [
    {
      id: "int-1",
      drug_a: "Amoxicillin",
      drug_b: "Penicillin Allergy",
      severity: "CRITICAL",
      guideline_ref: "WHO Model Formulary 2024 (Section 6.2 Antibacterials)",
      mechanism:
        "High cross-reactivity and risk of IgE-mediated type-I anaphylaxis in patients with verified penicillin hypersensitivity.",
      recommendation:
        "Avoid all beta-lactams. Macrolide alternative (Azithromycin) correctly selected by clinician.",
      confidence: 0.98,
    },
    {
      id: "int-2",
      drug_a: "Azithromycin",
      drug_b: "Food Intake",
      severity: "INFO",
      guideline_ref: "Clinical Pharmacokinetics & Drug Formularies",
      mechanism:
        "Administration with meals reduces gastrointestinal discomfort and nausea without significantly impairing bioavailability.",
      recommendation: "Instruct patient to take Azithromycin with food.",
      confidence: 0.88,
    },
  ];

  const mockDiagnoses = [
    { id: "d-1", icd_code: "J20.9", description: "Acute bronchitis, unspecified" },
    { id: "d-2", icd_code: "Z88.0", description: "Allergy status to penicillin" },
  ];

  const mockMedications = [
    {
      id: "m-1",
      name: "Azithromycin",
      dosage: "500mg Day 1, 250mg Days 2-5",
      frequency: "Once daily",
      duration: "5 days",
      route: "Oral",
      rag_checked: true,
      rag_verdict: "Safe Alternative",
    },
    {
      id: "m-2",
      name: "Guaifenesin",
      dosage: "400mg",
      frequency: "Every 4 hours PRN",
      duration: "7 days",
      route: "Oral",
      rag_checked: true,
      rag_verdict: "Safe",
    },
  ];

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 space-y-6">
          {/* Top Encounter Navigation & Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-1.5 rounded-[var(--radius-xs)] border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Return to Clinical Roster"
                aria-label="Back to clinical roster"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Clinical Encounter Review
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    ENC-849201A
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Consultation: John Doe (DOB: 15 May 1980)
                </h1>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="warning" size="md" dot>
                Awaiting Clinician Review
              </Badge>

              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit Notes
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save Draft
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
                className="text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Share Rx
              </Button>
            </div>
          </div>

          {/* Split-Screen Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Pane (40%, 5 cols): Audio Player + Verbatim Transcript + Diagnoses */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
              {/* Audio Recording & Waveform */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-primary" />
                    Clinical Audio Recording
                  </h2>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    08m 30s • 44.1kHz
                  </span>
                </div>

                <ClinicalAudioPlayer audioUrl="https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" />
              </div>

              {/* Verbatim Audio Transcript */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Verbatim Audio Transcript
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Nova-2 ASR
                  </span>
                </div>
                <div
                  className="max-h-[360px] overflow-y-auto p-3 rounded-[var(--radius-sm)] bg-muted/20 border border-border/60 text-xs text-foreground/90 leading-relaxed font-sans space-y-2"
                  tabIndex={0}
                  aria-label="Encounter audio transcript"
                >
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">00:04</span>
                    <strong>Dr. Jenkins:</strong> Good morning Mr. Doe. What brings you in today?
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">00:12</span>
                    <strong>Patient:</strong> Doctor, I have had this terrible chest cough for about 5 days now. It feels heavy and I started having a low fever yesterday.
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">00:25</span>
                    <strong>Dr. Jenkins:</strong> Are you coughing up any sputum or blood? Any shortness of breath?
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">00:34</span>
                    <strong>Patient:</strong> Yellowish sputum, no blood. But I get winded just walking up the stairs to my apartment.
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">00:52</span>
                    <strong>Dr. Jenkins:</strong> Any known drug allergies we should be aware of?
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">01:04</span>
                    <strong>Patient:</strong> Yes, severe anaphylaxis to Penicillin when I was ten. Broke out in hives and my throat swelled up.
                  </p>
                  <p>
                    <span className="font-mono text-[10px] text-primary font-semibold mr-1.5">01:18</span>
                    <strong>Dr. Jenkins:</strong> Understood. We will strictly avoid amoxicillin and penicillin class antibiotics and prescribe a safe macrolide alternative, azithromycin.
                  </p>
                </div>
              </div>

              {/* Extracted Diagnoses & ICD-10 */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    Diagnoses & ICD-10 Codes
                  </h2>
                </div>

                <div className="space-y-2">
                  {mockDiagnoses.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-[var(--radius-sm)] border border-border/80 bg-muted/20 flex items-start justify-between gap-2"
                    >
                      <p className="text-xs text-foreground font-medium">{d.description}</p>
                      <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold shrink-0">
                        {d.icd_code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Pane (60%, 7 cols): Pharmacological Safety + SOAP Editor + Medications */}
            <div className="lg:col-span-7 space-y-5">
              {/* Pharmacological Safety Alerts Card */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                  Pharmacological Safety Guardrails
                </h2>
                <DrugInteractionBanner
                  interactions={mockInteractions}
                  onAcknowledgeAll={setIsCriticalAcked}
                />
              </div>

              {/* SOAP Clinical Progress Note */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs">
                <SoapNoteEditor
                  isEditing={isEditing}
                  isVerified={false}
                  values={soapValues}
                  onChange={(field, value) =>
                    setSoapValues((prev) => ({ ...prev, [field]: value }))
                  }
                />
              </div>

              {/* Prescribed Regimen & Medications */}
              <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Pill className="w-3.5 h-3.5 text-primary" />
                    Prescribed Regimen & Formulations
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mockMedications.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-[var(--radius-sm)] border border-border/80 bg-muted/20 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{m.name}</p>
                        <Badge variant="success" size="sm">
                          {m.rag_verdict}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-[11px] font-mono text-muted-foreground">
                        <span>{m.dosage}</span>
                        <span>• {m.frequency}</span>
                        <span>• {m.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Docked Review Status Bar */}
        <ReviewStatusBar
          totalItems={6}
          verifiedItems={isCriticalAcked ? 6 : 4}
          criticalAlertCount={1}
          criticalAlertsAcknowledged={isCriticalAcked}
          canApprove={isCriticalAcked}
          isApproving={false}
          onApprove={() => alert("Approved and prescription unlocked!")}
          onSaveDraft={() => alert("Draft saved")}
        />

        {/* Share Prescription Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-card border border-border rounded-[var(--radius-lg)] shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-bold text-sm text-foreground">
                  Share Encrypted Prescription
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-[var(--radius-xs)] hover:bg-muted transition-colors"
                  aria-label="Close share dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                Signed HMAC-SHA256 link valid for 7 days. Grants read-only patient access:
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 px-2.5 rounded-[var(--radius-sm)] border border-input bg-muted/40 text-xs text-foreground font-mono truncate flex items-center select-all">
                  https://clearnote.health/consultations/public/pat-849201/rx?token=hmac_9a2f7c1d
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
