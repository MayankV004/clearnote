"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-muted/50" />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;
  const label = theme === "dark" ? "Dark Mode" : theme === "light" ? "Light Mode" : "System Theme";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Current: ${label} (Click to toggle)`}
      aria-label={`Toggle theme (currently ${label})`}
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
