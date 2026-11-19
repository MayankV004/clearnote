"use client";

import React, { useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useConsultation } from "../api/useConsultation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioRecorderModal({ isOpen, onClose, patientId }: Props) {
  const {
    status,
    setStatus,
    duration,
    error: recordError,
    activeConsultationId,
    startRecording,
    stopRecording,
    reset,
  } = useAudioRecorder(patientId);

  // Poll for completion if we are processing
  const { data: consultation } = useConsultation(activeConsultationId);

  useEffect(() => {
    if (status === "processing" && consultation) {
      if (consultation.status === "AWAITING_REVIEW" || consultation.status === "COMPLETE") {
        setStatus("complete");
        toast.success("Extraction complete! SOAP note is ready for your clinical review.", {
          duration: 5000,
        });
      } else if (consultation.status === "FAILED") {
        setStatus("error");
        toast.error(
          consultation.processing_error || "Transcription failed. Please try again.",
          { duration: 6000 }
        );
      }
    }
  }, [consultation, status, setStatus]);

  const queryClient = useQueryClient();

  const handleClose = () => {
    if (status === "complete") {
      queryClient.invalidateQueries({ queryKey: ["consultations", patientId] });
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative bg-card rounded-[var(--radius-lg)] shadow-xl border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/60 bg-muted/20">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              Clinical Encounter Audio Capture
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Secure WebSocket live stream • Deepgram Nova-2
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={status === "recording"}
            className="p-1 rounded-[var(--radius-xs)] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[240px] text-center">
          {/* STATE: IDLE & STARTING */}
          {(status === "idle" || status === "starting") && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Mic className="w-7 h-7" />
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Ensure microphone access is permitted. Click start when the patient consultation begins.
              </p>
              <Button
                size="md"
                onClick={startRecording}
                isLoading={status === "starting"}
                className="w-full"
              >
                Start Recording Encounter
              </Button>
            </div>
          )}

          {/* STATE: RECORDING */}
          {status === "recording" && (
            <div className="space-y-5 w-full flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping opacity-75" />
                <div className="relative z-10 w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-destructive animate-pulse" />
                </div>
              </div>

              <div className="text-3xl font-mono text-foreground font-bold tracking-tight">
                {formatDuration(duration)}
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                Audio streaming securely to transcription engine...
              </p>

              <Button
                variant="destructive"
                size="md"
                onClick={stopRecording}
                className="w-full"
              >
                <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Finish & Stop Recording
              </Button>
            </div>
          )}

          {/* STATE: PROCESSING */}
          {status === "processing" && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                Analyzing Clinical Dialogue...
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed font-mono">
                Extracting SOAP sections, ICD-10 diagnosis candidates, and checking pharmacological safety guardrails.
              </p>
              <Badge variant="primary" size="sm">
                Processing Encounter
              </Badge>
            </div>
          )}

          {/* STATE: COMPLETE */}
          {status === "complete" && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                Clinical Extraction Complete
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                SOAP documentation is ready for clinician sign-off.
              </p>
              <div className="flex gap-2 w-full pt-2">
                <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
                  Done
                </Button>
                {activeConsultationId && (
                  <Link
                    href={`/dashboard/consultations/${activeConsultationId}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-[var(--radius-sm)] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
                  >
                    Open Reviewer
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* STATE: ERROR */}
          {status === "error" && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-destructive">Recording Error</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                {recordError || "Unable to complete recording session. Please verify your connection."}
              </p>
              <Button variant="outline" size="sm" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
