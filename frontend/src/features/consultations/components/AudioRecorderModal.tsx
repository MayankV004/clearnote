"use client";

import { useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useConsultation } from "../api/useConsultation";
import { useQueryClient } from "@tanstack/react-query";

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
      if (consultation.status === "COMPLETE") {
        setStatus("complete");
      } else if (consultation.status === "FAILED") {
        setStatus("error");
      }
    }
  }, [consultation, status, setStatus]);

  const queryClient = useQueryClient();

  // Handle closing completely
  const handleClose = () => {
    if (status === "complete") {
      // Invalidate the consultations list so it immediately fetches the new one
      queryClient.invalidateQueries({ queryKey: ["consultations", patientId] });
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={status === "idle" || status === "complete" || status === "error" ? handleClose : undefined} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Area */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Consultation Recording</h3>
          <p className="text-xs text-slate-500 mt-1">Live audio is streamed securely</p>
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
          
          {/* STATE: IDLE & STARTING */}
          {(status === "idle" || status === "starting") && (
            <>
              <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-teal-600" />
              </div>
              <button
                onClick={startRecording}
                disabled={status === "starting"}
                className={`w-full py-3.5 rounded-2xl font-bold transition-all shadow-sm ${
                  status === "starting"
                    ? "bg-teal-400 text-white cursor-not-allowed shadow-none flex justify-center items-center gap-2"
                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                }`}
              >
                {status === "starting" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Start Recording"
                )}
              </button>
              <button 
                onClick={handleClose} 
                disabled={status === "starting"}
                className="mt-4 text-sm font-medium text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          )}

          {/* STATE: RECORDING */}
          {status === "recording" && (
            <>
              {/* Pulsating Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>

              <div className="text-3xl font-mono text-slate-900 font-light mb-8">
                {formatDuration(duration)}
              </div>

              <button
                onClick={stopRecording}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </button>
            </>
          )}

          {/* STATE: PROCESSING */}
          {status === "processing" && (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Transcribing Audio</h4>
              <p className="text-sm text-slate-500 text-center max-w-[250px]">
                Deepgram is processing the medical transcription. This usually takes a few seconds...
              </p>
            </>
          )}

          {/* STATE: COMPLETE */}
          {status === "complete" && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Transcription Complete</h4>
              <p className="text-sm text-slate-500 text-center mb-8">
                The SOAP note has been generated successfully.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition-colors"
              >
                Close
              </button>
            </>
          )}

          {/* STATE: ERROR */}
          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Recording Failed</h4>
              <p className="text-sm text-red-500 text-center max-w-[250px] mb-8">
                {recordError || consultation?.processing_error || "An unknown error occurred."}
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition-colors"
              >
                Close
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
