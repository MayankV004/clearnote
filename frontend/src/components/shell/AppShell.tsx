"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  Stethoscope,
  ShieldCheck,
  UserPlus,
  Mic,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
      group: "Clinical Workspace",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          active: pathname === "/dashboard",
          badge: null,
        },
        {
          label: "All Patients",
          href: "/dashboard/patients",
          icon: Users,
          active: pathname === "/dashboard/patients" || pathname.startsWith("/dashboard/patients/"),
          badge: null,
        },
        {
          label: "SOAPs & Consultations",
          href: "/dashboard/consultations",
          icon: FileText,
          active: pathname === "/dashboard/consultations" || pathname.startsWith("/dashboard/consultations/"),
          badge: null,
        },
      ],
    },
    {
      group: "Practice Management",
      items: [
        {
          label: "Profile & Signature",
          href: "/dashboard/settings",
          icon: Settings,
          active: pathname === "/dashboard/settings",
          badge: "DEA / Rx",
        },
      ],
    },
  ];

  const handleQuickAdd = () => {
    setIsMobileDrawerOpen(false);
    if (onAddPatient) {
      onAddPatient();
    } else {
      window.dispatchEvent(new CustomEvent("clearnote:open-add-patient"));
    }
  };

  const handleQuickRecord = () => {
    setIsMobileDrawerOpen(false);
    if (onStartConsultation) {
      onStartConsultation();
    } else {
      window.dispatchEvent(new CustomEvent("clearnote:open-record"));
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Part: Logo, BAA, Quick Action, Navigation */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-primary/90 transition-colors">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-none">
                ClearNote
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                Clinical Health
              </span>
            </div>
          </Link>

          {/* HIPAA BAA Assurance Pill */}
          <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-xs)] border border-teal-500/20 bg-teal-500/5 text-[10px] font-mono text-teal-700 dark:text-teal-300">
            <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate font-semibold">HIPAA BAA Protected</span>
          </div>
        </div>

        {/* Quick Action Primary Button */}
        <div className="px-4 space-y-1.5">
          <Button
            onClick={handleQuickRecord}
            leftIcon={<Mic className="w-3.5 h-3.5" />}
            size="sm"
            className="w-full text-xs font-semibold justify-center h-8"
          >
            Start Recording (R)
          </Button>
          <button
            onClick={handleQuickAdd}
            className="w-full inline-flex items-center justify-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-[var(--radius-xs)] border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserPlus className="w-3 h-3 text-muted-foreground" />
            <span>+ Register Patient (N)</span>
          </button>
        </div>

        {/* Navigation Group Sections */}
        <nav className="px-3 space-y-6">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono mb-2">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors group",
                        item.active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wide",
                            item.active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Search trigger item in nav */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono mb-2">
              Clinical Search
            </p>
            <button
              type="button"
              onClick={() => {
                setIsMobileDrawerOpen(false);
                setIsCommandOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                <span>Command Search</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border text-muted-foreground shadow-xs">
                ⌘K
              </kbd>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Docked Section: Doctor Card + Theme + Sign Out */}
      <div className="p-3 border-t border-border bg-card/60 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-muted/40 border border-border/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={user?.fullName || user?.firstName || "Doctor"}
              src={user?.imageUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                Dr. {user?.firstName || "Clinician"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">
                Attending MD
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[var(--radius-xs)] transition-colors font-medium text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Practice</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20">
      {/* Skip to Content Link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius-sm)] focus:shadow-md"
      >
        Skip to main clinical content
      </a>

      {/* Offline Connectivity Notification */}
      <OfflineBanner />

      {/* Desktop Fixed Sidebar (w-64) */}
      <aside
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 border-r border-border bg-card/95 backdrop-blur-md"
        aria-label="Clinical Management Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-card/90 backdrop-blur-md px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 rounded-[var(--radius-sm)] border border-border text-foreground hover:bg-muted"
            aria-label="Open clinical navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-xs)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              ClearNote
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted"
            aria-label="Command search"
          >
            <Search className="w-4 h-4" />
          </button>
          <ThemeToggle />
          <Avatar
            name={user?.fullName || "Doctor"}
            src={user?.imageUrl}
            size="sm"
          />
        </div>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[80vw] h-full border-r border-border bg-card shadow-xl z-50 flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-[var(--radius-xs)] text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <main
          id="main-content"
          className="flex-1 focus:outline-none pt-14 lg:pt-0"
        >
          {children}
        </main>
      </div>

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
