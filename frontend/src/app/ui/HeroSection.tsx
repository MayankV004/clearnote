"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { animate, createScope, stagger } from "animejs";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scope = useRef<any>(null);

  useEffect(() => {
    scope.current = createScope({ root: heroRef }).add(() => {
      // Staggered text reveal
      animate('.hero-anim-item', {
        translateY: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(150)
      });

      // Flowing liquid background morphing
      animate('.liquid-shape-1', {
        translateX: ['-50%', '-45%', '-50%'],
        translateY: ['-50%', '-55%', '-50%'],
        scale: [1, 1.1, 1],
        rotate: [0, 10, 0],
        duration: 15000,
        ease: 'inOutSine',
        loop: true
      });

      animate('.liquid-shape-2', {
        translateX: [0, -30, 0],
        translateY: [0, 40, 0],
        scale: [1, 1.15, 1],
        rotate: [0, -15, 0],
        duration: 18000,
        ease: 'inOutSine',
        loop: true
      });
    });

    return () => {
      if (scope.current) scope.current.revert();
    };
  }, []);

  return (
    <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white/30">
      {/* Liquid Glass Background Gradients */}



      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">

          <div className="hero-anim-item opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-cyan-100 text-cyan-700 text-sm font-medium mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            <span>Premium AI Clinical Documentation</span>
          </div>

          <h1 className="hero-anim-item opacity-0 text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl">
            Focus on your patients, <br className="hidden md:block" />
            <span className="text-brand-teal">
              let AI handle the notes.
            </span>
          </h1>

          <p className="hero-anim-item opacity-0 text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
            ClearNote securely records your consultations, generates accurate prescriptions, and helps you manage patient care—all with zero manual typing and maximum compliance.
          </p>

          <div className="hero-anim-item opacity-0 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-darkteal text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_40px_-10px_rgba(8,145,178,0.5)] w-full sm:w-auto min-h-[44px] cursor-pointer border border-cyan-400/30"
            >
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white/70 hover:bg-white backdrop-blur-md text-slate-900 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 border border-slate-200/50 hover:border-cyan-200 shadow-sm hover:shadow-md w-full sm:w-auto min-h-[44px] cursor-pointer"
            >
              View Dashboard
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
