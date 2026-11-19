"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-xs)] text-xs font-medium border select-none transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground border-border",
        primary: "bg-accent text-accent-foreground border-primary/20",
        success: "bg-success-subtle text-success-foreground border-success/30 dark:text-emerald-300",
        warning: "bg-warning-subtle text-warning-foreground border-warning/30 dark:text-amber-300",
        destructive: "bg-destructive/10 text-destructive border-destructive/20 dark:text-rose-400",
        ai: "bg-ai-subtle text-ai border-ai-border font-semibold",
        outline: "bg-transparent text-foreground border-border",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.2",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "destructive" && "bg-destructive",
            variant === "ai" && "bg-ai",
            variant === "primary" && "bg-primary",
            (!variant || variant === "default" || variant === "outline") && "bg-muted-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
