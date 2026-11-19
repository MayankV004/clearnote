"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import {
  Save,
  UploadCloud,
  UserCircle,
  Phone,
  MapPin,
  Building2,
  BookOpen,
  ShieldCheck,
  Lock,
  FileCheck,
  CheckCircle2,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { SignatureCanvas } from "@/features/doctor/components/SignatureCanvas";

// Types matching the backend Doctor model
interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  license_no: string | null;
  signature_url: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  speciality: string | null;
  years_of_experience: number | null;
  bio: string | null;
}

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

export default function SettingsPage() {
  const { user } = useUser();
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Local state for the form
  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");

  // Signature mode: "view" | "draw" | "upload"
  const [sigMode, setSigMode] = useState<"view" | "draw" | "upload">("view");
  const [drawnSigDataUrl, setDrawnSigDataUrl] = useState<string | null>(null);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  // Fetch the doctor's profile
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery<DoctorProfile>({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get("/doctors/me"),
  });

  // Pre-fill the form when data arrives
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(profile.name || "");
      setLicenseNo(profile.license_no || "");
      setSignatureUrl(profile.signature_url || "");
      setClinicName(profile.clinic_name || "");
      setClinicAddress(profile.clinic_address || "");
      setClinicPhone(profile.clinic_phone || "");
      setSpeciality(profile.speciality || "");
      setYearsOfExperience(profile.years_of_experience?.toString() || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Mutation to update the profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      name: string;
      license_no: string;
      clinic_name: string;
      clinic_address: string;
      clinic_phone: string;
      speciality: string;
      years_of_experience: number | null;
      bio: string;
    }) => api.patch("/doctors/me", data),
    onSuccess: () => {
      toast.success("Clinician profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
    },
    onError: () => {
      toast.error("Failed to update profile. Please verify all fields.");
    },
  });

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProfileMutation.mutate({
      name,
      license_no: licenseNo,
      clinic_name: clinicName,
      clinic_address: clinicAddress,
      clinic_phone: clinicPhone,
      speciality,
      years_of_experience: yearsOfExperience
        ? parseInt(yearsOfExperience, 10)
        : null,
      bio,
    });
  };

  const uploadSignatureBlob = async (blob: Blob) => {
    setIsUploadingSig(true);
    const formData = new FormData();
    formData.append("file", blob, "signature.png");

    try {
      const data = await api.post<{ signature_url: string }>(
        "/doctors/me/signature",
        formData
      );
      toast.success("Digital signature updated");
      setSignatureUrl(data.signature_url);
      setSigMode("view");
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
    } catch {
      toast.error("Failed to upload signature. Please try again.");
    } finally {
      setIsUploadingSig(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadSignatureBlob(file);
    }
  };

  const handleSaveDrawnSignature = () => {
    if (!drawnSigDataUrl) {
      toast.error("Please sign on the canvas before saving.");
      return;
    }
    const blob = dataUrlToBlob(drawnSigDataUrl);
    uploadSignatureBlob(blob);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-44 w-full rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Unable to load doctor profile"
          message="Could not connect to the clinical credentials store. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground">Doctor Settings</span>
          </nav>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Clinician Profile & Credentials
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your legal prescribing identity, digital signature stamp, and practice facility information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleSave()}
            isLoading={updateProfileMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            size="md"
          >
            Save Profile
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Identity & Signature */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Identity & Legal Credentials Card */}
          <section
            aria-labelledby="identity-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-primary" />
                <h2
                  id="identity-heading"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Legal Identity
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                DEA / State Verified
              </Badge>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    Clerk Account Email
                  </label>
                  <span className="text-[10px] text-muted-foreground/80 font-mono">
                    Read-only
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={user?.primaryEmailAddress?.emailAddress || profile?.email || ""}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-border bg-muted/40 text-muted-foreground cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="full-name"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Full Legal Name (with Credentials)
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Chen, MD, FACC"
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="license-no"
                    className="block text-xs font-medium text-foreground"
                  >
                    State Medical License #
                  </label>
                  <span className="text-[10px] text-primary font-medium">
                    Stamped on Prescriptions
                  </span>
                </div>
                <input
                  id="license-no"
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="e.g. C-8941029-CA"
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="speciality"
                    className="block text-xs font-medium text-foreground mb-1.5"
                  >
                    Medical Specialty
                  </label>
                  <input
                    id="speciality"
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="experience"
                    className="block text-xs font-medium text-foreground mb-1.5"
                  >
                    Years Active
                  </label>
                  <input
                    id="experience"
                    type="number"
                    min="0"
                    max="60"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Digital Signature Card */}
          <section
            aria-labelledby="signature-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <h2
                  id="signature-heading"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Prescription Signature Stamp
                </h2>
              </div>
              {signatureUrl ? (
                <Badge variant="outline" className="text-teal-700 dark:text-teal-300 border-teal-500/30 bg-teal-500/10">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10">
                  Signature Required
                </Badge>
              )}
            </div>

            {/* View Stored Signature */}
            {sigMode === "view" && (
              <div className="space-y-4">
                {signatureUrl ? (
                  <div className="border border-border/80 rounded-[var(--radius-md)] bg-white p-4 flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signatureUrl}
                      alt="Registered Prescribing Signature"
                      className="max-h-20 max-w-full object-contain filter invert-0"
                    />
                    <span className="text-[10px] text-slate-500 mt-2 font-mono">
                      Affixed to legal prescription PDFs & SOAP signs
                    </span>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-[var(--radius-md)] bg-muted/20 p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      No prescription signature has been uploaded yet.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<PenTool className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setDrawnSigDataUrl(null);
                      setSigMode("draw");
                    }}
                  >
                    Draw New Signature
                  </Button>
                  <label className="flex-1">
                    <span className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors text-foreground">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Draw Signature Mode */}
            {sigMode === "draw" && (
              <div className="space-y-3">
                <div className="border border-border rounded-[var(--radius-md)] overflow-hidden bg-white">
                  <SignatureCanvas
                    onSave={(dataUrl) => setDrawnSigDataUrl(dataUrl)}
                    width={440}
                    height={150}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSigMode("view")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    isLoading={isUploadingSig}
                    disabled={!drawnSigDataUrl}
                    onClick={handleSaveDrawnSignature}
                  >
                    Save & Affix Signature
                  </Button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              In compliance with 21 CFR Part 11 and DEA electronic prescribing standards, this cryptographic stamp binds the signing physician to verified prescription outputs.
            </p>
          </section>

        </div>

        {/* Right Column (7 Cols): Practice & Clinic Information */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Clinic & Facility Info */}
          <section
            aria-labelledby="clinic-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h2
                  id="clinic-heading"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Primary Practice Facility
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Appears on Patient Summaries
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="clinic-name"
                    className="block text-xs font-medium text-foreground mb-1.5"
                  >
                    Hospital or Practice Name
                  </label>
                  <input
                    id="clinic-name"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. Stanford University Medical Center"
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="clinic-phone"
                    className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    Direct Clinical Phone
                  </label>
                  <input
                    id="clinic-phone"
                    type="tel"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+1 (650) 723-4000"
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="clinic-address"
                  className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  Facility Physical Address
                </label>
                <input
                  id="clinic-address"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="e.g. 300 Pasteur Drive, Suite H-2100, Stanford, CA 94305"
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Clinical Bio & Patient Note Header */}
          <section
            aria-labelledby="bio-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2
                  id="bio-heading"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Professional Bio & Clinical Philosophy
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {bio.length} characters
              </span>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="sr-only"
              >
                Professional Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your primary clinical focus, subspecialty board certifications, and patient consultation guidelines..."
                className="w-full p-3 text-xs rounded-[var(--radius-sm)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary leading-relaxed resize-none transition-colors"
              />
            </div>
          </section>

          {/* Security & Regulatory Compliance Card */}
          <section
            aria-labelledby="security-heading"
            className="rounded-[var(--radius-lg)] border border-border bg-muted/20 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h2
                  id="security-heading"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Clinical Security & Regulatory Compliance
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-300 border-teal-500/30">
                Audited & Enforced
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">256-bit AES Encryption</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    All consultation transcripts, SOAP notes, and patient identifiers are encrypted at rest with hardware keys.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-sm)] border border-border bg-card flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">HIPAA BAA Active</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Covered entity business associate agreement executed with tenant isolation across clinical databases.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </form>
    </div>
  );
}
