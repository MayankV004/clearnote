"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCreateConsultation } from "../api/useCreateConsultation";

type RecordingStatus = "idle" | "starting" | "recording" | "processing" | "complete" | "error";

export function useAudioRecorder(patientId: string) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);

  const { mutateAsync: createConsultation } = useCreateConsultation();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setStatus("starting");
      setError(null);
      
      // 1. Create Consultation
      const consultation = await createConsultation({ patient_id: patientId });
      setActiveConsultationId(consultation.id);

      // 2. Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect WebSocket with auth token
      const token = await getToken();
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
      const wsUrl = `ws://localhost:8000/consultations/${consultation.id}/stream${tokenParam}`;
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      ws.onopen = () => {
        setStatus("recording");
        
        // 4. Start MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Send chunk every 1000ms
        mediaRecorder.start(1000);

        // Start timer
        setDuration(0);
        timerRef.current = window.setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      };

      ws.onerror = (e) => {
        console.error("WebSocket error", e);
        setError("WebSocket connection failed");
        // We handle stopRecording here to clean up
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
        }
        setStatus("error");
      };

    } catch (err: unknown) {
      console.error("Failed to start recording:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start recording. Please check microphone permissions.";
      setError(errorMessage);
      setStatus("error");
    }
  }, [patientId, createConsultation, getToken]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    if (status === "recording") {
        setStatus("processing");
    }
  }, [status]);

  const reset = useCallback(() => {
    stopRecording();
    setStatus("idle");
    setDuration(0);
    setError(null);
    setActiveConsultationId(null);
  }, [stopRecording]);

  return {
    status,
    setStatus,
    duration,
    error,
    activeConsultationId,
    startRecording,
    stopRecording,
    reset,
  };
}
