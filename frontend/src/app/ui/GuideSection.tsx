"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, FileSignature, Share, Bell, Wand2, FileSearch } from "lucide-react";

const steps = [
  {
    icon: <Mic className="h-6 w-6 text-teal-600" />,
    title: "1. Record Consultation",
    description: "Click the record button and capture your conversation securely with the patient."
  },
  {
    icon: <FileSearch className="h-6 w-6 text-teal-600" />,
    title: "2. Pick Template",
    description: "Select from standard prescription templates or your personalized formats."
  },
  {
    icon: <Wand2 className="h-6 w-6 text-teal-600" />,
    title: "3. AI Generation",
    description: "Our AI processes the audio and accurately drafts the entire prescription for you."
  },
  {
    icon: <FileSignature className="h-6 w-6 text-teal-600" />,
    title: "4. Manual Check & E-Sign",
    description: "Review the drafted notes, make necessary edits, and apply your digital signature."
  },
  {
    icon: <Share className="h-6 w-6 text-teal-600" />,
    title: "5. Share Prescription",
    description: "Instantly share the signed document with the patient or pharmacy."
  },
  {
    icon: <Bell className="h-6 w-6 text-teal-600" />,
    title: "6. Set Up Notifications",
    description: "Configure automated medication reminders to improve patient adherence."
  }
];

export function GuideSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-teal-600 mb-6">
            How Doctors Use ClearNote
          </h2>
          <p className="text-slate-600 text-lg">
            A seamless workflow designed specifically for medical professionals.
          </p>
        </div>

        <div className="relative border-l-2 border-teal-100 ml-8 md:ml-12 space-y-8">
          
          {steps.map((step, idx) => {
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-center w-full"
              >
                {/* Icon Container */}
                <div className="absolute -left-[33px] flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 border-4 border-white z-10 shadow-sm text-teal-600">
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="w-full pl-16">
                  <div className="bg-white border-2 border-teal-100 p-6 rounded-2xl hover:border-teal-400 transition-colors shadow-sm text-left">
                    <h3 className="text-xl font-bold text-teal-600 mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
