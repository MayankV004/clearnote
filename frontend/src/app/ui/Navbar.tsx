"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Stethoscope, ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
        
        {/* Brand Logo & Clinical Badge */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-none">
                ClearNote
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Clinical Safety
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link
              href="#simulator"
              className="hover:text-foreground transition-colors"
            >
              Interactive Demo
            </Link>
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Capabilities
            </Link>
            <Link
              href="#workflow"
              className="hover:text-foreground transition-colors"
            >
              Clinical Workflow
            </Link>
            <Link
              href="#security"
              className="hover:text-foreground transition-colors"
            >
              HIPAA & Security
            </Link>
          </nav>
        </div>

        {/* Right Navigation Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          <div className="h-4 w-px bg-border" />

          {isLoaded && isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
              >
                Go to Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-[var(--radius-sm)] border border-border",
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/sign-in"
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-sm)] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-[var(--radius-sm)] border border-border text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-card p-4 space-y-3">
          <nav className="flex flex-col gap-2 text-sm text-foreground">
            <Link
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-2 rounded hover:bg-muted"
            >
              Interactive Demo
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-2 rounded hover:bg-muted"
            >
              Capabilities
            </Link>
            <Link
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-2 rounded hover:bg-muted"
            >
              Clinical Workflow
            </Link>
            <Link
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-2 rounded hover:bg-muted"
            >
              HIPAA & Security
            </Link>
          </nav>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Link
              href="/sign-in"
              className="text-xs font-medium text-foreground py-2"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-primary text-primary-foreground text-xs font-semibold"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
