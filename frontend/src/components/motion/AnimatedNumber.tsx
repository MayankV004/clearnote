"use client";

import React, { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  formatter = (v) => Math.round(v).toLocaleString(),
  className = "",
  ...props
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, shouldReduceMotion]);

  const output = shouldReduceMotion ? value : displayValue;

  return (
    <span className={`tabular-nums font-mono ${className}`} {...props}>
      {formatter(output)}
    </span>
  );
}
