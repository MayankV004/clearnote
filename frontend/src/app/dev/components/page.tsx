"use client";

import React, { useState } from "react";
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Badge,
  Banner,
  Dialog,
  Drawer,
  ConfirmDialog,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  Avatar,
  Tooltip,
  EmptyState,
  ErrorState,
  PermissionDenied,
  Skeleton,
} from "@/components/ui";
import {
  AIContentBlock,
  CitationChip,
  ConfidenceIndicator,
  ReviewStatusBar,
  DiffView,
  StreamingText,
} from "@/components/clinical";
import {
  Reveal,
  FadeStagger,
  FadeStaggerItem,
  AnimatedNumber,
} from "@/components/motion";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function ComponentGalleryPage() {
  // Interactive UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [denseTable, setDenseTable] = useState(false);
  const [streamingKey, setStreamingKey] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(3);
  const [criticalAcked, setCriticalAcked] = useState(false);

  // Sample synthetic clinical data (No real PHI)
  const sampleTableData = [
    { id: "ENC-101", patient: "Synthetic Patient Alpha", time: "09:30 AM", status: "COMPLETE", doctor: "Dr. S. Jenkins" },
    { id: "ENC-102", patient: "Synthetic Patient Beta", time: "10:15 AM", status: "AWAITING_REVIEW", doctor: "Dr. S. Jenkins" },
    { id: "ENC-103", patient: "Synthetic Patient Gamma", time: "11:00 AM", status: "PROCESSING", doctor: "Dr. S. Jenkins" },
    { id: "ENC-104", patient: "Synthetic Patient Delta", time: "01:30 PM", status: "CRITICAL_ALERT", doctor: "Dr. S. Jenkins" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 font-sans selection:bg-primary/20">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Page Header Component Demonstration */}
        <PageHeader
          title="ClearNote Design System Gallery"
          description="Living catalog of clinical tokens, base primitives, clinical AI governance widgets, and functional motion."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Design System", href: "/dev/components" },
            { label: "Components" },
          ]}
          badge={<Badge variant="primary">Phase A Foundation</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">Theme:</span>
              <ThemeToggle />
            </div>
          }
        />

        {/* 1. BUTTONS & ICON BUTTONS */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">1. Buttons &amp; Interactive Triggers</h2>
            <p className="text-xs text-muted-foreground">Variants, sizes, loading, and disabled states.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost Trigger</Button>
            <Button variant="destructive">Critical Destructive</Button>
            <Button variant="ai">AI Suggestion</Button>
            <Button variant="link">Inline Link</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="xs">Size XS</Button>
            <Button size="sm">Size SM</Button>
            <Button size="md">Size MD (Default)</Button>
            <Button size="lg">Size LG</Button>
            <Button isLoading>Processing...</Button>
            <Button disabled>Disabled Action</Button>
            <Button leftIcon={<Plus className="w-4 h-4" />}>Add Medication</Button>
            <IconButton icon={<Save className="w-4 h-4" />} label="Save clinical note" />
            <IconButton icon={<Trash2 className="w-4 h-4 text-destructive" />} label="Delete record" variant="outline" />
          </div>
        </section>

        {/* 2. FORM INPUTS & SELECTS */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">2. Clinical Form Controls</h2>
            <p className="text-xs text-muted-foreground">Standardized inputs, textareas, selects, and toggles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Medical License Number"
              placeholder="e.g. MED-NY-849201"
              helperText="Stamps automatically onto generated prescriptions."
            />
            <Input
              label="Patient Age"
              placeholder="e.g. 45"
              error="Age must be a valid integer."
            />
            <Select
              label="Clinical Specialty"
              options={[
                { value: "internal", label: "Internal Medicine" },
                { value: "cardio", label: "Cardiology" },
                { value: "pediatrics", label: "Pediatrics" },
              ]}
            />
          </div>

          <Textarea
            label="Subjective Consultation Notes"
            placeholder="Document patient statements, symptoms, and chief complaints..."
            defaultValue="Patient reports 5-day history of dry, unproductive cough with evening fevers reaching 100.8 F."
          />

          <div className="flex flex-wrap items-center gap-8 pt-2">
            <Checkbox
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              label="Patient HIPAA Consent Recorded"
              description="Confirmed authorization for digital recording and storage."
            />
            <Switch
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
              label="Automatic Prescription Dispatch"
              description="Sends PDF securely via SMS/Email upon sign-off."
            />
          </div>
        </section>

        {/* 3. TABS & AVATARS & TOOLTIPS */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">3. Navigation Tabs, Avatars &amp; Tooltips</h2>
            <p className="text-xs text-muted-foreground">Animated tab pill, initials/avatar generation, accessible micro-tooltips.</p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Encounter Overview</TabsTrigger>
              <TabsTrigger value="soap">SOAP Note Details</TabsTrigger>
              <TabsTrigger value="history">Patient History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-4 rounded-[var(--radius-md)] border border-border bg-card text-xs">
              Overview panel: 14 encounters scheduled today. Next patient arriving at 10:30 AM.
            </TabsContent>
            <TabsContent value="soap" className="p-4 rounded-[var(--radius-md)] border border-border bg-card text-xs">
              SOAP clinical review: Subjective, Objective, Assessment, Plan fields populated by AI extraction.
            </TabsContent>
            <TabsContent value="history" className="p-4 rounded-[var(--radius-md)] border border-border bg-card text-xs">
              Past encounter records dating back to patient intake.
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Avatar name="Sarah Jenkins" size="sm" />
              <Avatar name="Sarah Jenkins" size="md" />
              <Avatar name="Sarah Jenkins" size="lg" />
              <Avatar name="Sarah Jenkins" size="xl" />
            </div>

            <Tooltip content="Verified under HIPAA 45 CFR § 164.312">
              <Button variant="outline" size="sm" leftIcon={<Info className="w-3.5 h-3.5" />}>
                Hover for Compliance Tooltip
              </Button>
            </Tooltip>
          </div>
        </section>

        {/* 4. STATUS BANNERS & BADGES */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">4. Status Banners &amp; Clinical Badges</h2>
            <p className="text-xs text-muted-foreground">3-tier anti-alarm-fatigue severity scale.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Active Encounters</Badge>
            <Badge variant="success" dot>Complete &amp; Signed</Badge>
            <Badge variant="warning" dot>Awaiting Clinician Review</Badge>
            <Badge variant="destructive" dot>Critical Interaction</Badge>
            <Badge variant="ai" dot>AI Drafted</Badge>
          </div>

          <div className="space-y-3 pt-2">
            <Banner variant="destructive" title="Critical Drug Contraindication Detected">
              Amoxicillin 500mg contraindicated due to documented anaphylactic Penicillin allergy.
            </Banner>
            <Banner variant="warning" title="Missing HIPAA Consent">
              Encounter audio cannot be permanently ingested until patient consent documentation is confirmed.
            </Banner>
            <Banner variant="success" title="Prescription Dispatched">
              Signed prescription PDF was uploaded to S3 and securely delivered to patient terminal.
            </Banner>
            <Banner variant="ai" title="AI Extraction Complete">
              SOAP note synthesized using Llama 3.3 70B with grounding against WHO guidelines.
            </Banner>
            <Banner variant="info" title="System Maintenance Notice">
              Scheduled clinical vector index reindexing at 02:00 AM UTC. Consultations unaffected.
            </Banner>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Encounter saved to local clinical storage.")}
            >
              Trigger Sonner Toast Notification
            </Button>
          </div>
        </section>

        {/* 5. CLINICAL AI GOVERNANCE COMPONENTS */}
        <section className="space-y-6">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">5. Clinical AI Trust &amp; Governance Widgets</h2>
            <p className="text-xs text-muted-foreground">Source citations, provenance badges, confidence bars, and diff audit.</p>
          </div>

          {/* AI Content Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AIContentBlock status="draft" title="Extracted Assessment (A)" timestamp="10:15 AM">
              Acute bacterial pharyngitis (ICD-10: J02.9). Secondary symptoms include pharyngeal erythema and low-grade pyrexia.
            </AIContentBlock>
            <AIContentBlock status="verified" title="Clinician Verified Plan (P)" timestamp="10:18 AM">
              Azithromycin 500mg on Day 1, followed by 250mg daily for 4 days. Encourage hydration and throat lozenges.
            </AIContentBlock>
          </div>

          {/* Citation Chips & Confidence Meters */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Guideline Provenance &amp; Retrieval Confidence
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <CitationChip
                title="WHO Model Formulary: Section 6.2.1"
                source="WHO Guidelines"
                confidence={0.92}
              />
              <CitationChip
                title="AHA Guidelines for Hypertension"
                source="AHA 2024"
                confidence={0.68}
              />
              <CitationChip
                title="Unverified Local Formulary"
                source="Custom Hospital Formulary"
                confidence={0.35}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <ConfidenceIndicator score={0.94} />
              <ConfidenceIndicator score={0.65} />
              <ConfidenceIndicator score={0.35} isUnverifiedInGuidelines />
            </div>
          </div>

          {/* Diff Audit View */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AI Draft vs Clinician Edits (Audit Diff)
            </h3>
            <DiffView
              originalText="Patient prescribed Amoxicillin 500mg TID for 10 days to treat suspected streptococcal pharyngitis."
              editedText="Patient prescribed Azithromycin 500mg Day 1, then 250mg Days 2-5 due to documented Penicillin allergy."
            />
          </div>

          {/* Streaming Text */}
          <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-ai" />
                Live Clinical Text Stream Simulation
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setStreamingKey((k) => k + 1)}
                leftIcon={<RotateCcw className="w-3 h-3" />}
              >
                Replay Stream
              </Button>
            </div>
            <p className="text-sm font-sans leading-relaxed">
              <StreamingText
                key={streamingKey}
                text="The patient was advised to follow up in 5 days if fever persists or dyspnea develops. Sputum culture pending."
              />
            </p>
          </div>
        </section>

        {/* 6. DATA TABLES & DENSE MODE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h2 className="text-base font-bold text-foreground">6. Clinical Data Table (Desktop + Mobile Cards)</h2>
              <p className="text-xs text-muted-foreground">Sortable columns, responsive mobile card collapse, and compact mode.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={denseTable}
                onCheckedChange={setDenseTable}
                label="Dense Mode"
              />
            </div>
          </div>

          <Table
            dense={denseTable}
            data={sampleTableData}
            keyExtractor={(row) => row.id}
            columns={[
              { key: "id", header: "Encounter ID", className: "font-mono text-xs" },
              { key: "patient", header: "Patient Name", sortable: true },
              { key: "time", header: "Time", sortable: true },
              {
                key: "status",
                header: "Clinical Status",
                render: (row) => (
                  <Badge
                    variant={
                      row.status === "COMPLETE"
                        ? "success"
                        : row.status === "CRITICAL_ALERT"
                        ? "destructive"
                        : "warning"
                    }
                    dot
                  >
                    {row.status}
                  </Badge>
                ),
              },
              { key: "doctor", header: "Attending Physician" },
            ]}
          />
        </section>

        {/* 7. MODALS, DRAWERS & CONFIRM DIALOGS */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">7. Overlays, Dialogs &amp; Drawers</h2>
            <p className="text-xs text-muted-foreground">Accessible focus-trapped dialogs with Esc keyboard listeners.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              Open Standard Modal Dialog
            </Button>
            <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
              Open Mobile Slide-Over Drawer
            </Button>
            <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
              Trigger Critical Confirm Dialog
            </Button>
          </div>

          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Clinical Prescription Approval"
            description="Audit pharmacological contraindications and confirm state medical license stamp."
          >
            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                By approving this clinical encounter, you confirm that all medications and diagnostic codes
                have been verified under your legal medical license.
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setIsDialogOpen(false)}>
                  Confirm Approval
                </Button>
              </div>
            </div>
          </Dialog>

          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Verbatim Deepgram Audio Transcript"
          >
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p><strong className="text-foreground">00:05 Dr. Jenkins:</strong> Good morning. How can I help you today?</p>
              <p><strong className="text-foreground">00:12 Patient:</strong> I’ve had a severe cough and chest tightness since Wednesday.</p>
              <p><strong className="text-foreground">00:24 Dr. Jenkins:</strong> Any allergies to antibiotics like Penicillin?</p>
              <p><strong className="text-foreground">00:28 Patient:</strong> Yes, I get hives and swelling from Penicillin.</p>
            </div>
          </Drawer>

          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={() => {
              setIsConfirmOpen(false);
              toast.error("Clinical record deleted.");
            }}
            title="Purge Patient Consultation"
            description="Are you certain you wish to exercise HIPAA right-to-erasure? This will permanently delete all audio recordings, transcripts, and prescription PDFs from S3."
            confirmLabel="Permanently Delete"
            variant="destructive"
          />
        </section>

        {/* 8. SKELETONS & EMPTY STATES */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">8. Loading Skeletons &amp; State Fallbacks</h2>
            <p className="text-xs text-muted-foreground">Designed to match real patient rows and clinical cards.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Skeleton Card Placeholder</p>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Table Row Shimmer</p>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Avatar Shimmer</p>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <EmptyState
              title="No Consultations Recorded"
              description="Start documenting a patient visit or import an audio file to begin AI extraction."
              action={{
                label: "Start Encounter",
                onClick: () => toast.info("Opening encounter launcher..."),
              }}
            />
            <ErrorState
              title="Failed to Load Roster"
              message="The clinical database pooler timed out. Your local session is secure."
              onRetry={() => toast.success("Refetched successfully.")}
            />
            <PermissionDenied
              title="Unauthorized Encounter"
              message="Access to this patient record is restricted to attending physicians with tenant clearance."
              onBack={() => toast.info("Returning to roster...")}
            />
          </div>
        </section>

        {/* 9. MOTION PRIMITIVES & REVEALS */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">9. Motion Primitives &amp; Tabular Counters</h2>
            <p className="text-xs text-muted-foreground">Functional motion using transform/opacity only, with reduced-motion safe fallback.</p>
          </div>

          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Total Consultations</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  <AnimatedNumber value={142} />
                </p>
              </div>
              <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Completed &amp; Signed</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <AnimatedNumber value={128} />
                </p>
              </div>
              <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Drug Harms Prevented</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  <AnimatedNumber value={14} />
                </p>
              </div>
              <div className="p-4 rounded-[var(--radius-md)] border border-border bg-card">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Avg Charting Time Saved</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  <AnimatedNumber value={2.5} formatter={(v) => `${v.toFixed(1)} hrs`} />
                </p>
              </div>
            </div>
          </Reveal>

          <FadeStagger className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <FadeStaggerItem className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border border-border text-xs">
              <strong>Stagger Item 1:</strong> Speech-to-text transcription via Deepgram Nova-3 Medical.
            </FadeStaggerItem>
            <FadeStaggerItem className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border border-border text-xs">
              <strong>Stagger Item 2:</strong> Semantic clinical guideline chunk retrieval with pgvector.
            </FadeStaggerItem>
            <FadeStaggerItem className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border border-border text-xs">
              <strong>Stagger Item 3:</strong> Pharmacological contraindication reasoning via Llama 3.3 70B.
            </FadeStaggerItem>
          </FadeStagger>
        </section>

        {/* 10. STICKY REVIEW STATUS BAR DEMO */}
        <section className="space-y-4 pt-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-foreground">10. Sticky Clinical Review Dock</h2>
            <p className="text-xs text-muted-foreground">Enforces human-in-the-loop review gating before prescription approval.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVerifiedCount((c) => Math.min(c + 1, 4))}
            >
              Verify Next Section ({verifiedCount}/4)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCriticalAcked(!criticalAcked)}
            >
              Toggle Critical Warning Acknowledgment ({criticalAcked ? "Acked" : "Unacked"})
            </Button>
          </div>

          <ReviewStatusBar
            totalItems={4}
            verifiedItems={verifiedCount}
            criticalAlertCount={1}
            criticalAlertsAcknowledged={criticalAcked}
            canApprove={verifiedCount >= 4 && criticalAcked}
            onApprove={() => toast.success("Encounter approved! Prescriptions unlocked.")}
            onSaveDraft={() => toast.info("Draft saved.")}
          />
        </section>
      </div>
    </div>
  );
}
