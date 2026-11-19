"use client";

import React, { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface StreamingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  speedMs?: number;
  onComplete?: () => void;
  isStreaming?: boolean;
}

export function StreamingText({
  text,
  speedMs = 25,
  onComplete,
  isStreaming = true,
  className,
  ...props
}: StreamingTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedLength, setDisplayedLength] = useState(
    shouldReduceMotion || !isStreaming ? text.length : 0
  );

  useEffect(() => {
    if (shouldReduceMotion || !isStreaming) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedLength(text.length);
      onComplete?.();
      return;
    }

    setDisplayedLength(0);
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 2; // Stream 2 characters per tick for fluid prose reading
      if (currentIndex >= text.length) {
        setDisplayedLength(text.length);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayedLength(currentIndex);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs, isStreaming, shouldReduceMotion, onComplete]);

  const isDone = displayedLength >= text.length;

  return (
    <span className={cn("inline text-foreground", className)} {...props}>
      {text.slice(0, displayedLength)}
      {!isDone && isStreaming && (
        <span
          className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
