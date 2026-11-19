"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "none";
  distance?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.24,
  direction = "up",
  distance = 8,
  className = "",
  style,
  id,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} style={style} className={className}>
        {children}
      </div>
    );
  }

  const initialY = direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <motion.div
      id={id}
      style={style}
      initial={{ opacity: 0, y: initialY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // standard clinical outQuart
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
