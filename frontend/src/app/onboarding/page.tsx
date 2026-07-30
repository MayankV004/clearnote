"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { animate } from "animejs";
import Image from "next/image";
import {
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { doctorOnboardingSchema, type DoctorOnboardingFormValues } from "@/features/doctor/validations";
import { toast } from "sonner";

const STEPS = [
  {
    id: 1,
    title: "Professional Details",
    subtitle: "Your credentials & speciality",
    icon: User,
  },
  {
    id: 2,
    title: "Clinic Information",
    subtitle: "Where you practice",
    icon: Building2,
  },
  {
    id: 3,
    title: "Your Story",
    subtitle: "Let patients know you",
    icon: User,
  },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, text: "Your data is encrypted & secure" },
  { icon: ClipboardList, text: "Takes less than 3 minutes" },
  { icon: Sparkles, text: "Patients can discover you after completion" },
];

function InputField({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "block w-full px-4 py-3 rounded-2xl border border-cyan-100 bg-white/70 backdrop-blur-md text-slate-900 placeholder-slate-400 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover:border-cyan-300 shadow-sm";

function AnimeStep({ children, stepKey }: { children: React.ReactNode, stepKey: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      animate(ref.current, {
        translateX: [24, 0],
        opacity: [0, 1],
        ease: 'outQuart',
        duration: 400
      });
    }
  }, [stepKey]);
  return <div ref={ref}>{children}</div>;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success("Profile complete! Welcome to ClearNote.");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const step = STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-500/30">

      {/* ── Top Nav Bar (matches site Navbar) ────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-100 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="ClearNote Logo" width={40} height={40} className="drop-shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-slate-900 text-brand-teal">ClearNote</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
            <span>Step {currentStep} of {STEPS.length}</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex min-h-screen pt-[73px]">

        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col border-r border-cyan-100 bg-white/30 px-10 py-16 flex-shrink-0 relative overflow-hidden">
          {/* Subtle teal glow */}
          

          <div className="relative z-10 flex flex-col h-full">
            {/* Greeting */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-cyan-200 text-cyan-700 text-xs font-medium mb-4 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Profile Setup</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">
                Welcome, Dr. {user?.firstName || "Doctor"}!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Complete your profile to start seeing patients on ClearNote. It takes less than 3 minutes.
              </p>
            </div>

            {/* Step List */}
            <div className="space-y-3 flex-1">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.id;
                const isCurrent = currentStep === s.id;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 ${
                      isCurrent
                        ? "bg-white/70 backdrop-blur-md border-cyan-200 shadow-sm"
                        : isCompleted
                        ? "bg-white/50 border-cyan-100"
                        : "bg-white/40 border-slate-100 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-cyan-600 text-white"
                          : isCurrent
                          ? "bg-white text-cyan-600 border border-cyan-200 shadow-sm"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isCurrent ? "text-slate-900" : isCompleted ? "text-cyan-700" : "text-slate-400"}`}>
                        {s.title}
                      </p>
                      <p className={`text-xs ${isCurrent ? "text-slate-500" : "text-slate-400"}`}>
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Signals */}
            <div className="mt-10 pt-8 border-t border-slate-200 space-y-3">
              {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-slate-500">
                  <Icon className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16 xl:px-24">
          <div className="max-w-[500px] w-full mx-auto">

            {/* Mobile Step Label */}
            <div className="lg:hidden mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-cyan-200 text-cyan-700 text-xs font-medium">
                <StepIcon className="h-3.5 w-3.5" />
                <span>{step.title}</span>
              </div>
            </div>

            {/* Section Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                {step.title}
              </h1>
              <p className="text-slate-500 text-sm">{step.subtitle}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-teal rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="min-h-[260px]">
                  {/* STEP 1 */}
                  {currentStep === 1 && (
                    <AnimeStep stepKey={1}>
                      <div className="space-y-5">
                      <InputField label="Medical Speciality" id="speciality" error={errors.speciality?.message}>
                        <input
                          id="speciality"
                          {...register("speciality")}
                          className={inputClass}
                          placeholder="e.g. Cardiology, Pediatrics, General Practice"
                        />
                      </InputField>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Years of Experience" id="years_of_experience" error={errors.years_of_experience?.message}>
                          <input
                            id="years_of_experience"
                            type="number"
                            min={0}
                            {...register("years_of_experience", { valueAsNumber: true })}
                            className={inputClass}
                            placeholder="0"
                          />
                        </InputField>
                        <InputField label="Medical License No." id="license_no" error={errors.license_no?.message}>
                          <input
                            id="license_no"
                            {...register("license_no")}
                            className={inputClass}
                            placeholder="MED-12345"
                          />
                        </InputField>
                      </div>
                      </div>
                    </AnimeStep>
                  )}

                  {/* STEP 2 */}
                  {currentStep === 2 && (
                    <AnimeStep stepKey={2}>
                      <div className="space-y-5">
                      <InputField label="Primary Clinic / Hospital Name" id="clinic_name" error={errors.clinic_name?.message}>
                        <input
                          id="clinic_name"
                          {...register("clinic_name")}
                          className={inputClass}
                          placeholder="City General Hospital"
                        />
                      </InputField>
                      <InputField label="Clinic Address" id="clinic_address" error={errors.clinic_address?.message}>
                        <input
                          id="clinic_address"
                          {...register("clinic_address")}
                          className={inputClass}
                          placeholder="123 Health Avenue, Suite 100, Mumbai"
                        />
                      </InputField>
                      <InputField label="Clinic Phone Number" id="clinic_phone" error={errors.clinic_phone?.message}>
                        <input
                          id="clinic_phone"
                          {...register("clinic_phone")}
                          className={inputClass}
                          placeholder="+91 98765 43210"
                        />
                      </InputField>
                    </div>
                    </AnimeStep>
                  )}

                  {/* STEP 3 */}
                  {currentStep === 3 && (
                    <AnimeStep stepKey={3}>
                      <div className="space-y-4">
                      <InputField label="Professional Bio" id="bio" error={errors.bio?.message}>
                        <textarea
                          id="bio"
                          rows={6}
                          {...register("bio")}
                          className={`${inputClass} resize-none`}
                          placeholder="Share your background, approach to patient care, and any special interests. Patients will see this on your profile..."
                        />
                      </InputField>
                      <p className="text-xs text-slate-400">
                        Minimum 10 characters. Visible to patients on your public profile.
                      </p>
                      </div>
                    </AnimeStep>
                  )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                    currentStep === 1
                      ? "text-slate-300 border-slate-100 cursor-not-allowed"
                      : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-darkteal text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_20px_-10px_rgba(8,145,178,0.5)]"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-darkteal text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_20px_-10px_rgba(8,145,178,0.5)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
