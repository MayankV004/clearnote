"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
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

const STEPS = [
  {
    id: 1,
    title: "Professional Details",
    subtitle: "Your credentials & speciality",
    icon: Stethoscope,
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
  "block w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-slate-300 shadow-sm";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

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
    setServerError("");
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
      router.replace("/dashboard");
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "An unexpected error occurred.");
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ClearNote</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Step {currentStep} of {STEPS.length}</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex min-h-screen pt-[73px]">

        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col border-r border-slate-200 bg-slate-50 px-10 py-16 flex-shrink-0 relative overflow-hidden">
          {/* Subtle teal glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Greeting */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-600 text-xs font-medium mb-4">
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
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      isCurrent
                        ? "bg-white border-teal-200 shadow-sm"
                        : isCompleted
                        ? "bg-teal-50 border-teal-100"
                        : "bg-white border-slate-100 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-teal-600 text-white"
                          : isCurrent
                          ? "bg-teal-50 text-teal-600 border border-teal-200"
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
                      <p className={`text-sm font-semibold ${isCurrent ? "text-slate-900" : isCompleted ? "text-teal-700" : "text-slate-400"}`}>
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-600 text-xs font-medium">
                <StepIcon className="h-3.5 w-3.5" />
                <span>{step.title}</span>
              </div>
            </div>

            {/* Section Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`header-${currentStep}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                  {step.title}
                </h1>
                <p className="text-slate-500 text-sm">{step.subtitle}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="mb-8 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-600 rounded-full"
                initial={false}
                animate={{ width: `${Math.max(progressPct, 8)}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="min-h-[260px]">
                <AnimatePresence mode="wait">
                  {/* STEP 1 */}
                  {currentStep === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-5"
                    >
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
                    </motion.div>
                  )}

                  {/* STEP 2 */}
                  {currentStep === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-5"
                    >
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
                    </motion.div>
                  )}

                  {/* STEP 3 */}
                  {currentStep === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-4"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(13,148,136,0.25)]"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(13,148,136,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
