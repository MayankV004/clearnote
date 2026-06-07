"use client";

import React from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Stethoscope } from "lucide-react";

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
            <Stethoscope className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">ClearNote</span>
        </Link>

        {/* Desktop Nav Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          {isLoaded && isSignedIn ? (
            <UserButton 

              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 border border-slate-200",
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
