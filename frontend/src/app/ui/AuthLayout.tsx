"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { animate, createScope } from "animejs";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scope = useRef<any>(null);

  useEffect(() => {
    scope.current = createScope({ root: containerRef }).add(() => {
      animate('.auth-content-anim', {
        translateY: [20, 0],
        opacity: [0, 1],
        ease: 'outQuart',
        duration: 800
      });

      animate('.liquid-bg-auth', {
        translateX: ['-50%', '-45%', '-50%'],
        translateY: ['-50%', '-55%', '-50%'],
        scale: [1, 1.1, 1],
        rotate: [0, 5, 0],
        duration: 20000,
        ease: 'inOutSine',
        loop: true
      });
    });

    return () => {
      if (scope.current) scope.current.revert();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white/30 flex relative overflow-hidden">
      {/* Background Liquid Effects */}



      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex flex-col relative z-10">

        {/* Header */}
        <header className="p-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.png" alt="ClearNote Logo" width={32} height={32} className="drop-shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-slate-900 text-brand-teal">ClearNote</span>
          </Link>
        </header>

        {/* Center Box */}
        <main className="flex-1 flex items-center justify-center p-6 flex-col">
          <div className="auth-content-anim opacity-0 w-full max-w-md">

            <div className="mb-8 text-center flex flex-col items-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                Welcome to ClearNote
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Securely access your clinical workspace.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <div className="relative flex w-full justify-center">
                {children}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
