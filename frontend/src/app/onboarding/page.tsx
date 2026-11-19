"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Lock,
  FileCheck,
  Stethoscope,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  doctorOnboardingSchema,
  type DoctorOnboardingFormValues,
} from "@/features/doctor/validations";
import { SignatureCanvas } from "@/features/doctor/components/SignatureCanvas";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

const STEPS = [
  {
    id: 1,
    title: "Professional Credentials",
    subtitle: "Medical specialty, experience & state license",
    icon: Stethoscope,
  },
  {
    id: 2,
    title: "Practice & Clinic Information",
    subtitle: "Primary hospital or practice address and contact",
    icon: Building2,
  },
  {
    id: 3,
    title: "Prescription Signature",
    subtitle: "Digital signature pad & clinical biography",
    icon: FileCheck,
  },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, text: "HIPAA-compliant BAA protected data store" },
  { icon: Lock, text: "256-bit AES encryption at rest and in transit" },
  { icon: FileCheck, text: "License stamped onto legal prescription PDFs" },
];

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(";base64,");
  const contentType = parts[0].split(":")[1] || "image/png";
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<DoctorOnboardingFormValues>({
    resolver: zodResolver(doctorOnboardingSchema),
    defaultValues: {
      speciality: "",
      years_of_experience: 0,
      license_no: "",
      clinic_name: "",
      clinic_address: "",
      clinic_phone: "",
      bio: "",
    },
    mode: "onTouched",
  });

  const nextStep = async () => {
    const fieldsMap: Record<number, (keyof DoctorOnboardingFormValues)[]> = {
      1: ["speciality", "years_of_experience", "license_no"],
      2: ["clinic_name", "clinic_address", "clinic_phone"],
    };
    const valid = await trigger(fieldsMap[currentStep]);
    if (valid) setCurrentStep((p) => Math.min(p + 1, 3));
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const onSubmit = async (data: DoctorOnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Submission failed. Please try again.");
      }

      // Upload signature if drawn
      if (signatureDataUrl) {
        try {
          const blob = dataUrlToBlob(signatureDataUrl);
          const formData = new FormData();
          formData.append("file", blob, "signature.png");
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me/signature`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } catch {
          toast.warning("Profile saved, but signature upload could not be verified.");
        }
      }

      toast.success("Profile complete! Welcome to ClearNote.");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              +
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">ClearNote</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Clinical Setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row mx-auto max-w-7xl w-full">
        {/* Left Sidebar Checklist (Desktop) */}
        <aside className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-border p-8 justify-between bg-card/40">
          <div className="space-y-8">
            <div>
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Physician Onboarding
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
                Welcome, Dr. {user?.lastName || user?.firstName || "Doctor"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Configure your practice credentials to unlock automated transcription, SOAP notes, and legal e-prescriptions.
              </p>
            </div>

            {/* Stepper Navigation */}
            <nav className="space-y-3" aria-label="Onboarding Steps">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.id;
                const isCurrent = currentStep === s.id;

                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-[var(--radius-md)] border transition-colors ${
                      isCurrent
                        ? "border-primary/40 bg-primary/5 text-foreground shadow-xs"
                        : isCompleted
                        ? "border-border bg-card/60 text-muted-foreground"
                        : "border-transparent text-muted-foreground/60"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Clinical Security Signals */}
          <div className="pt-6 border-t border-border/60 space-y-2.5">
            {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-mono"
              >
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-lg w-full mx-auto space-y-6">
            {/* Step Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {Math.round(progressPct)}% Completed
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {STEPS[currentStep - 1].title}
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {STEPS[currentStep - 1].subtitle}
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="h-1.5 w-full bg-muted rounded-[var(--radius-xs)] overflow-hidden">
              <div
                className="h-full bg-primary rounded-[var(--radius-xs)] transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progressPct, 5)}%` }}
              />
            </div>

            {/* Wizard Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* STEP 1: Professional Details */}
              {currentStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label
                      htmlFor="speciality"
                      className="mb-1 block text-xs font-semibold text-foreground"
                    >
                      Medical Specialty <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="speciality"
                      {...register("speciality")}
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="e.g. Internal Medicine, Family Practice, Cardiology"
                    />
                    {errors.speciality && (
                      <p className="text-[11px] text-destructive mt-1 font-mono">
                        {errors.speciality.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="years_of_experience"
                        className="mb-1 block text-xs font-semibold text-foreground"
                      >
                        Years of Experience <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="years_of_experience"
                        type="number"
                        min={0}
                        {...register("years_of_experience", { valueAsNumber: true })}
                        className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                        placeholder="10"
                      />
                      {errors.years_of_experience && (
                        <p className="text-[11px] text-destructive mt-1 font-mono">
                          {errors.years_of_experience.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="license_no"
                        className="mb-1 block text-xs font-semibold text-foreground"
                      >
                        Medical License # <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="license_no"
                        {...register("license_no")}
                        className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono uppercase"
                        placeholder="MED-NY-849201"
                      />
                      {errors.license_no && (
                        <p className="text-[11px] text-destructive mt-1 font-mono">
                          {errors.license_no.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono">
                    Your state license number will be automatically stamped onto PDF prescriptions generated for your patients.
                  </p>
                </div>
              )}

              {/* STEP 2: Clinic Information */}
              {currentStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label
                      htmlFor="clinic_name"
                      className="mb-1 block text-xs font-semibold text-foreground"
                    >
                      Practice or Hospital Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="clinic_name"
                      {...register("clinic_name")}
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="e.g. Mount Sinai West Outpatient Clinic"
                    />
                    {errors.clinic_name && (
                      <p className="text-[11px] text-destructive mt-1 font-mono">
                        {errors.clinic_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="clinic_address"
                      className="mb-1 block text-xs font-semibold text-foreground"
                    >
                      Clinic Street Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="clinic_address"
                      {...register("clinic_address")}
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="e.g. 1000 10th Ave, New York, NY 10019"
                    />
                    {errors.clinic_address && (
                      <p className="text-[11px] text-destructive mt-1 font-mono">
                        {errors.clinic_address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="clinic_phone"
                      className="mb-1 block text-xs font-semibold text-foreground"
                    >
                      Workplace Direct Phone <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="clinic_phone"
                      {...register("clinic_phone")}
                      className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      placeholder="+1 (555) 234-5678"
                    />
                    {errors.clinic_phone && (
                      <p className="text-[11px] text-destructive mt-1 font-mono">
                        {errors.clinic_phone.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Bio & Digital Signature */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label
                      htmlFor="bio"
                      className="mb-1 block text-xs font-semibold text-foreground"
                    >
                      Professional Biography <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      {...register("bio")}
                      className="w-full text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground p-2.5 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-y"
                      placeholder="Share your clinical background, training, and approach to patient care..."
                    />
                    {errors.bio && (
                      <p className="text-[11px] text-destructive mt-1 font-mono">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <SignatureCanvas onSave={setSignatureDataUrl} />
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button type="button" size="sm" onClick={nextStep}>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" isLoading={isSubmitting}>
                    Complete Clinical Profile
                    <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
