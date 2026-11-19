"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalAudioPlayerProps {
  audioUrl?: string | null;
  onTimeUpdate?: (currentTimeSeconds: number) => void;
  className?: string;
}

export function ClinicalAudioPlayer({
  audioUrl,
  onTimeUpdate,
  className,
}: ClinicalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTime = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate]);

  if (!audioUrl) {
    return (
      <div className={cn("rounded-[var(--radius-md)] border border-dashed border-border bg-card/60 p-4 text-center", className)}>
        <p className="text-xs text-muted-foreground font-mono">
          Audio recording not stored or not available.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-border bg-card p-3.5 shadow-xs space-y-2.5",
        className
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Time Display */}
          <div className="text-xs font-mono text-muted-foreground">
            <span className="font-semibold text-foreground">{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed Selector */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] border border-border bg-muted/60 hover:bg-muted text-[11px] font-mono font-semibold text-foreground transition-colors"
          title="Playback Speed"
        >
          <FastForward className="w-3 h-3 text-muted-foreground" />
          <span>{playbackRate.toFixed(2)}x</span>
        </button>
      </div>

      {/* Scrub Range Bar */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-muted rounded-[var(--radius-xs)] appearance-none cursor-pointer accent-primary"
          aria-label="Seek audio"
        />
      </div>
    </div>
  );
}
