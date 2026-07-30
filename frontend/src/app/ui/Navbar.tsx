"use client";

import React from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/logo.png" alt="ClearNote Logo" width={44} height={44} className="drop-shadow-lg transition-transform group-hover:scale-105" />
          <span className="text-2xl font-extrabold tracking-tight text-brand-teal">ClearNote</span>
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
