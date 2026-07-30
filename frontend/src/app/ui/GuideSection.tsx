"use client";

import React, { useEffect, useRef } from "react";
import { Mic, FileSignature, Share, Bell, Wand2, FileSearch } from "lucide-react";
import { animate, createScope, stagger } from "animejs";

const steps = [
  {
    icon: <Mic className="h-6 w-6 text-cyan-600" />,
    title: "1. Record",
    description: "Hit record during your patient consultation. ClearNote securely captures the audio."
  },
  {
    icon: <Wand2 className="h-6 w-6 text-cyan-600" />,
    title: "2. Generate",
    description: "Our AI processes the audio and automatically structures it into a clinical SOAP note."
  },
  {
    icon: <FileSearch className="h-6 w-6 text-cyan-600" />,
    title: "3. Review",
    description: "Review the generated prescription. Make any necessary edits or adjustments."
  },
  {
    icon: <FileSignature className="h-6 w-6 text-cyan-600" />,
    title: "4. Sign",
    description: "Digitally sign the finalized prescription to make it an official document."
  },
  {
    icon: <Share className="h-6 w-6 text-cyan-600" />,
    title: "5. Share",
    description: "Instantly share the prescription with the patient via a secure, private link."
  },
  {
    icon: <Bell className="h-6 w-6 text-cyan-600" />,
    title: "6. Follow-up",
    description: "ClearNote automatically sets up medication reminders for the patient."
  }
];

export function GuideSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scope = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          scope.current = createScope({ root: containerRef }).add(() => {
            animate('.step-card-anim', {
              translateX: [-30, 0],
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
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Soft Glow */}
      

      <div className="max-w-screen-2xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            How it works
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            A seamless workflow designed specifically for modern healthcare professionals.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="step-card-anim opacity-0 flex flex-col p-6 rounded-3xl hover:bg-white/50 transition-colors duration-300"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
