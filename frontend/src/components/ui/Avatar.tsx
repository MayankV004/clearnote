"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Avatar({
  name = "User",
  src,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses =
    size === "sm"
      ? "w-7 h-7 text-[11px]"
      : size === "md"
      ? "w-9 h-9 text-xs"
      : size === "lg"
      ? "w-12 h-12 text-sm"
      : "w-16 h-16 text-base font-bold";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold border border-primary/20 shrink-0 select-none overflow-hidden",
        sizeClasses,
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
