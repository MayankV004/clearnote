"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Code2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { Avatar } from "@/components/ui/Avatar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  onAddPatient?: () => void;
  onStartConsultation?: () => void;
}

export function AppShell({
  children,
  onAddPatient,
  onStartConsultation,
}: AppShellProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Practice Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
    {
      label: "Component Gallery",
      href: "/dev/components",
      icon: Code2,
      active: pathname === "/dev/components",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Skip to Content Link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius-sm)] focus:shadow-md"
      >
        Skip to main clinical content
      </a>

      {/* Network Offline Alert */}
      <OfflineBanner />

      {/* Unified Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand + Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="sm:hidden p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                +
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground">ClearNote</span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Clinical
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-1 ml-6 border-l border-border pl-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors",
                      item.active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Quick Search + Command Palette Trigger + Theme Toggle + User Menu */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:flex items-center gap-3 h-8 px-3 rounded-[var(--radius-sm)] border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Search encounters, actions...</span>
              </div>
              <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-card border border-border shadow-xs">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted"
              aria-label="Open command search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-[var(--radius-sm)] hover:bg-muted transition-colors cursor-pointer"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <Avatar
                  name={user?.fullName || user?.firstName || "Doctor"}
                  src={user?.imageUrl}
                  size="sm"
                />
                <span className="hidden lg:inline-block text-xs font-semibold text-foreground max-w-[120px] truncate">
                  Dr. {user?.firstName || "Jenkins"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border/60">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Dr. {user?.fullName || "Sarah Jenkins"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                        {user?.primaryEmailAddress?.emailAddress || "doctor@clinic.org"}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted rounded-[var(--radius-xs)] transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Doctor Profile &amp; Signature</span>
                      </Link>
                      <Link
                        href="/dev/components"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted rounded-[var(--radius-xs)] transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Design System Gallery</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut({ redirectUrl: "/" });
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-[var(--radius-xs)] transition-colors text-left font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Clinic</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="sm:hidden border-t border-border bg-card px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors",
                    item.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {children}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onAddPatient={onAddPatient}
        onStartConsultation={onStartConsultation}
      />
    </div>
  );
}
