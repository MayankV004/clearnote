"use client";

import React, { useState } from "react";
import NotFound from "@/app/not-found";
import ErrorBoundary from "@/app/error";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export default function DevErrorPage() {
  const [view, setView] = useState<"404" | "500">("404");

  const mockError = new Error(
    "Failed to load patient consultation audio stream: Connection timed out after 10000ms."
  );
  (mockError as Error & { digest?: string }).digest = "ERR-RAG-AUDIO-7782";

  return (
    <div className="relative">
      {/* Floating View Switcher for visual audit */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] border border-border bg-card/90 backdrop-blur-md shadow-md">
        <button
          onClick={() => setView("404")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-xs)] transition-colors ${
            view === "404"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          404 Not Found
        </button>
        <button
          onClick={() => setView("500")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-xs)] transition-colors ${
            view === "500"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          500 Error
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <ThemeToggle />
      </div>

      {view === "404" ? (
        <NotFound />
      ) : (
        <ErrorBoundary error={mockError} reset={() => alert("Retry clicked")} />
      )}
    </div>
  );
}
