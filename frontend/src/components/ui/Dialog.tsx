"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
}: DialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Auto focus container or first input
      setTimeout(() => {
        contentRef.current?.focus();
      }, 50);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previouslyFocusedRef.current?.focus?.();
      };
    }
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  const maxWidthClass =
    maxWidth === "sm"
      ? "max-w-sm"
      : maxWidth === "md"
      ? "max-w-md"
      : maxWidth === "lg"
      ? "max-w-lg"
      : maxWidth === "xl"
      ? "max-w-xl"
      : "max-w-2xl";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "dialog-title" : undefined}
          aria-describedby={description ? "dialog-description" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          />

          {/* Dialog Container */}
          <motion.div
            ref={contentRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98, y: shouldReduceMotion ? 0 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98, y: shouldReduceMotion ? 0 : 4 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full rounded-[var(--radius-lg)] border border-border bg-card shadow-lg text-foreground overflow-hidden focus:outline-none z-10",
              maxWidthClass,
              className
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between border-b border-border p-5">
                <div>
                  {title && (
                    <h2 id="dialog-title" className="text-base font-semibold leading-tight text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="dialog-description" className="text-xs text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-[var(--radius-xs)] p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-4"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "left";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
}: DrawerProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 w-full max-w-md h-full bg-card border-border shadow-xl flex flex-col focus:outline-none ml-auto",
              side === "left" && "mr-auto ml-0 border-r",
              side === "right" && "ml-auto border-l"
            )}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-[var(--radius-sm)] border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold text-white transition-colors shadow-xs",
            variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isLoading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
