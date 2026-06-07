"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.1),rgba(255,255,255,0))]" />
      
      {/* Subtle grid pattern for texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Decorative blurred circles */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      {/* Main content wrapper */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ClearNote</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
            Welcome to ClearNote
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Securely access your clinical workspace.
          </p>
        </div>
        
        {/* Clerk Component Container */}
        <div className="relative flex w-full justify-center">
          {children}
        </div>
      </motion.div>
    </main>
  );
}
