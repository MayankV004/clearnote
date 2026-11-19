"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  onAddPatient?: () => void;
  onStartConsultation?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge: string | null;
}

interface NavGroup {
  group: string;
  items: NavItem[];
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore collapsed state from localStorage safely after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clearnote:sidebar-collapsed");
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("clearnote:sidebar-collapsed", String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleQuickAdd = useCallback(() => {
    setIsMobileDrawerOpen(false);
    if (onAddPatient) {
      onAddPatient();
    } else {
      window.dispatchEvent(new CustomEvent("clearnote:open-add-patient"));
    }
  }, [onAddPatient]);

  const handleQuickRecord = useCallback(() => {
    setIsMobileDrawerOpen(false);
    if (onStartConsultation) {
      onStartConsultation();
    } else {
      window.dispatchEvent(new CustomEvent("clearnote:open-record"));
    }
  }, [onStartConsultation]);

  // Global Keyboard Shortcuts: Cmd+K / Ctrl+K and Cmd+[ / Ctrl+[ / Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "[" || e.key.toLowerCase() === "b")) {
        e.preventDefault();
        toggleCollapse();
        return;
      }

      if (!isInput) {
        if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          handleQuickRecord();
        } else if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          handleQuickAdd();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapse, handleQuickRecord, handleQuickAdd]);

  const navItems: NavGroup[] = [
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

  // Reusable Sidebar Body renderer supporting expanded and collapsed states
  const renderSidebarContent = (collapsed: boolean) => {
    if (collapsed) {
      return (
        <div className="flex flex-col h-full justify-between items-center py-4 px-2 select-none">
          {/* Top Section */}
          <div className="w-full flex flex-col items-center gap-5">
            {/* Logo Mark */}
            <Tooltip content="ClearNote Clinical Health" side="right">
              <Link href="/dashboard" className="flex items-center justify-center group">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-primary/90 transition-colors">
                  <Stethoscope className="w-4.5 h-4.5" />
                </div>
              </Link>
            </Tooltip>

            {/* Expand Toggle Button */}
            <Tooltip content="Expand sidebar (⌘[ or ⌘B)" side="right">
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Expand sidebar"
                className="w-8 h-8 rounded-[var(--radius-xs)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* HIPAA Badge Icon */}
            <Tooltip content="HIPAA BAA Protected Platform" side="right">
              <div className="w-8 h-8 rounded-[var(--radius-xs)] border border-teal-500/20 bg-teal-500/5 flex items-center justify-center text-teal-700 dark:text-teal-300">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              </div>
            </Tooltip>

            {/* Divider */}
            <div className="w-8 border-t border-border" />

            {/* Quick Actions (Icons) */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip content="Start Recording (R)" side="right">
                <button
                  type="button"
                  onClick={handleQuickRecord}
                  aria-label="Start Recording Encounter"
                  className="w-9 h-9 rounded-[var(--radius-sm)] bg-primary text-primary-foreground flex items-center justify-center shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </Tooltip>

              <Tooltip content="+ Register Patient (N)" side="right">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  aria-label="Register New Patient"
                  className="w-9 h-9 rounded-[var(--radius-sm)] border border-border bg-card hover:bg-muted/70 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Divider */}
            <div className="w-8 border-t border-border" />

            {/* Navigation Icons */}
            <nav className="flex flex-col items-center gap-2">
              {navItems.flatMap((group) => group.items).map((item) => {
                const Icon = item.icon;
                return (
                  <Tooltip
                    key={item.href}
                    content={
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    }
                    side="right"
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={cn(
                        "w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center transition-colors group",
                        item.active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                    </Link>
                  </Tooltip>
                );
              })}

              {/* Command Search Icon */}
              <Tooltip content="Clinical Search (⌘K)" side="right">
                <button
                  type="button"
                  onClick={() => setIsCommandOpen(true)}
                  aria-label="Open Command Search"
                  className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              </Tooltip>
            </nav>
          </div>

          {/* Bottom Docked Section (Collapsed) */}
          <div className="w-full flex flex-col items-center gap-3 pt-3 border-t border-border">
            <Tooltip content={`Dr. ${user?.firstName || "Clinician"} (Attending MD)`} side="right">
              <div>
                <Avatar
                  name={user?.fullName || user?.firstName || "Doctor"}
                  src={user?.imageUrl}
                  size="sm"
                />
              </div>
            </Tooltip>

            <ThemeToggle />

            <Tooltip content="Sign Out of Practice" side="right">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
                aria-label="Sign Out of Practice"
                className="w-8 h-8 rounded-[var(--radius-xs)] flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      );
    }

    // Expanded Sidebar Content
    return (
      <div className="flex flex-col h-full justify-between">
        {/* Top Part: Logo, BAA, Quick Action, Navigation */}
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="px-5 pt-5 pb-1">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-primary/90 transition-colors shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-base tracking-tight text-foreground leading-none">
                    ClearNote
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                    Clinical Health
                  </span>
                </div>
              </Link>

              {/* Collapse Trigger Button (desktop only) */}
              <button
                type="button"
                onClick={toggleCollapse}
                title="Collapse sidebar (⌘[ or ⌘B)"
                aria-label="Collapse sidebar"
                className="hidden lg:flex p-1.5 rounded-[var(--radius-xs)] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* HIPAA BAA Assurance Pill */}
            <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-xs)] border border-teal-500/20 bg-teal-500/5 text-[10px] font-mono text-teal-700 dark:text-teal-300">
              <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate font-semibold">HIPAA BAA Protected</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
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
              className="w-full inline-flex items-center justify-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-[var(--radius-xs)] border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <UserPlus className="w-3 h-3 text-muted-foreground" />
              <span>+ Register Patient (N)</span>
            </button>
          </div>

          {/* Navigation Group Sections */}
          <nav className="px-3 space-y-5">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono mb-1.5">
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
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono mb-1.5">
                Clinical Search
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsCommandOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors group cursor-pointer"
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
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[var(--radius-xs)] transition-colors font-medium text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Practice</span>
          </button>
        </div>
      </div>
    );
  };

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

      {/* Desktop Fixed Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-border bg-card/95 backdrop-blur-md transition-[width] duration-200 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
        aria-label="Clinical Management Navigation"
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-card/90 backdrop-blur-md px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 rounded-[var(--radius-sm)] border border-border text-foreground hover:bg-muted cursor-pointer"
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
            className="p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted cursor-pointer"
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

      {/* Mobile Slide-Out Drawer (Always full expanded width) */}
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
                className="p-1.5 rounded-[var(--radius-xs)] text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarContent(false)}
          </div>
        </div>
      )}

      {/* Main Content Area: dynamically adjusts left padding to match collapsed or expanded state */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0 transition-[padding-left] duration-200 ease-in-out",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
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
