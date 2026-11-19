"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
      : side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-1.5"
      : "left-full top-1/2 -translate-y-1/2 ml-1.5";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-[var(--radius-xs)] bg-slate-900 dark:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-50 dark:text-slate-900 shadow-md animate-in fade-in duration-100",
            positionClasses,
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
