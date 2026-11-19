"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface FadeStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export function FadeStagger({
  children,
  staggerDelay = 0.06,
  className = "",
  id,
  style,
}: FadeStaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} style={style} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      style={style}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface FadeStaggerItemProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export function FadeStaggerItem({
  children,
  className = "",
  id,
  style,
}: FadeStaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} style={style} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
