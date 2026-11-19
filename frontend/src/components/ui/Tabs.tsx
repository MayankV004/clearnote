"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (newVal: string) => {
    if (!isControlled) setUncontrolledValue(newVal);
    onValueChange?.(newVal);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full space-y-3", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-start rounded-[var(--radius-sm)] bg-muted p-1 text-muted-foreground border border-border/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  const shouldReduceMotion = useReducedMotion();
  if (!context) throw new Error("TabsTrigger must be used inside Tabs");

  const isActive = context.value === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none z-10",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 rounded-[calc(var(--radius-sm)-2px)] bg-card border border-border/80 shadow-xs z-[-1]"
        />
      )}
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used inside Tabs");

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    >
      {children}
    </div>
  );
}
