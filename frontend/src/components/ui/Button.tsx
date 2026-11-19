"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98] transition-transform duration-75",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/80",
        outline: "bg-transparent text-foreground hover:bg-muted border border-border",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        ai: "bg-ai text-ai-foreground hover:bg-ai/90 shadow-xs",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto active:scale-100",
      },
      size: {
        xs: "h-7 px-2.5 rounded-[var(--radius-xs)] text-xs",
        sm: "h-8 px-3 rounded-[var(--radius-sm)] text-xs",
        md: "h-9 px-4 rounded-[var(--radius-md)] text-sm",
        lg: "h-11 px-5 rounded-[var(--radius-md)] text-base",
        icon: "h-9 w-9 rounded-[var(--radius-md)] p-0",
        "icon-sm": "h-7 w-7 rounded-[var(--radius-sm)] p-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: React.ReactNode;
  label: string;
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "icon",
      icon,
      label,
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
