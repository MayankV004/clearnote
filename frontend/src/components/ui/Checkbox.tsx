"use client";

import React, { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, disabled, onChange, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex items-start gap-3 select-none",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded-[var(--radius-xs)] border border-border bg-card peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
            {checked && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="text-left">
            {label && <p className="text-xs font-medium text-foreground">{label}</p>}
            {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
