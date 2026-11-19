"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/AppShell";
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
import { SignatureCanvas } from "@/features/doctor/components/SignatureCanvas";
import { toast } from "sonner";

// High-contrast clean SVG data URL for realistic signature preview
const sampleSignatureDataUrl =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 80' width='320' height='80'><path d='M20,55 C40,25 70,10 90,45 C100,60 120,65 140,35 C155,15 170,40 190,50 C210,60 230,25 250,30 C270,35 290,45 305,40' fill='none' stroke='%230F172A' stroke-width='3' stroke-linecap='round'/><path d='M80,50 L260,52' fill='none' stroke='%230F172A' stroke-width='2' stroke-linecap='round'/></svg>";

function SettingsPreviewContent() {
  const [name, setName] = useState("Dr. Alexander Wright, MD, FACC");
  const [licenseNo, setLicenseNo] = useState("C-8492019-CA");
  const [signatureUrl, setSignatureUrl] = useState(sampleSignatureDataUrl);
  const [clinicName, setClinicName] = useState("Stanford Healthcare - Cardiovascular Institute");
  const [clinicAddress, setClinicAddress] = useState("300 Pasteur Drive, Suite H-2100, Stanford, CA 94305");
  const [clinicPhone, setClinicPhone] = useState("+1 (650) 723-4000");
  const [speciality, setSpeciality] = useState("Cardiovascular Medicine");
  const [yearsOfExperience, setYearsOfExperience] = useState("14");
  const [bio, setBio] = useState(
    "Specializing in interventional cardiology, ischemic heart disease, and preventative lipid pharmacotherapy. Active clinical investigator with Stanford Cardiovascular Health."
  );

  const [sigMode, setSigMode] = useState<"view" | "draw">("view");
  const [drawnSigDataUrl, setDrawnSigDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Clinician profile updated successfully");
    }, 400);
  };

  const handleSaveDrawnSignature = () => {
    if (!drawnSigDataUrl) {
      toast.error("Please sign on the canvas before saving.");
      return;
    }
    setSignatureUrl(drawnSigDataUrl);
    setSigMode("view");
    toast.success("Digital signature updated");
  };

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
            isLoading={isSaving}
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
                  value="alexander.wright@clearnote.health"
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
              <Badge variant="outline" className="text-teal-700 dark:text-teal-300 border-teal-500/30 bg-teal-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Active
              </Badge>
            </div>

            {/* View Stored Signature */}
            {sigMode === "view" && (
              <div className="space-y-4">
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
                      onChange={() => toast.success("File uploaded")}
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

export default function DevSettingsPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <SettingsPreviewContent />
      </AppShell>
    </QueryClientProvider>
  );
}
