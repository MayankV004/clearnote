"use client";

import React, { useEffect, useRef } from "react";
import { ShieldCheck, Zap, Stethoscope, BellRing, Share2, FileText } from "lucide-react";
import { animate, createScope, stagger } from "animejs";

const features = [
  {
    icon: <Zap className="h-6 w-6 text-cyan-600" />,
    title: "AI-Powered Generation",
    description: "Instantly convert your consultation audio into structured, accurate medical prescriptions."
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-cyan-600" />,
    title: "Secure & Compliant",
    description: "Built with privacy in mind. Your data and your patients' data are securely encrypted."
  },
  {
    icon: <FileText className="h-6 w-6 text-cyan-600" />,
    title: "Custom Templates",
    description: "Choose from various specialty-specific templates or create your own custom formats."
  },
  {
    icon: <Stethoscope className="h-6 w-6 text-cyan-600" />,
    title: "Clinical Accuracy",
    description: "Manually review, edit, and e-sign everything before finalizing the document."
  },
  {
    icon: <Share2 className="h-6 w-6 text-cyan-600" />,
    title: "Easy Sharing",
    description: "Seamlessly share digital prescriptions with patients via secure links or email."
  },
  {
    icon: <BellRing className="h-6 w-6 text-cyan-600" />,
    title: "Medication Reminders",
    description: "Automatically set up push notifications to remind patients to take their medications."
  }
];

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scope = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          scope.current = createScope({ root: containerRef }).add(() => {
            animate('.feature-card-anim', {
              translateY: [30, 0],
              opacity: [0, 1],
              ease: 'outQuart',
              duration: 800,
              delay: stagger(100)
            });
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (scope.current) scope.current.revert();
    };
  }, []);

  return (
    <section className="py-24 relative border-y border-slate-200 overflow-hidden bg-white/10">
      <div className="absolute inset-0  " />
      <div className="max-w-screen-2xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-teal mb-6">
            Everything you need for modern care
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            ClearNote is packed with features designed to save you time and improve patient outcomes.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="feature-card-anim opacity-0 group relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-[var(--shadow-sm)] hover:border-cyan-200 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
              <div className="mb-6 inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white border border-cyan-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
