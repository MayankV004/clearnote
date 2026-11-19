"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "inline-flex items-center justify-between gap-4 select-none cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {(label || description) && (
        <div className="text-left">
          {label && <p className="text-xs font-semibold text-foreground">{label}</p>}
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition duration-200 ease-in-out transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}
