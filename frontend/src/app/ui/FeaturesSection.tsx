"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Stethoscope, BellRing, Share2, FileText } from "lucide-react";

const features = [
  {
    icon: <Zap className="h-6 w-6 text-teal-600" />,
    title: "AI-Powered Generation",
    description: "Instantly convert your consultation audio into structured, accurate medical prescriptions."
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-teal-600" />,
    title: "Secure & Compliant",
    description: "Built with privacy in mind. Your data and your patients' data are securely encrypted."
  },
  {
    icon: <FileText className="h-6 w-6 text-teal-600" />,
    title: "Custom Templates",
    description: "Choose from various specialty-specific templates or create your own custom formats."
  },
  {
    icon: <Stethoscope className="h-6 w-6 text-teal-600" />,
    title: "Clinical Accuracy",
    description: "Manually review, edit, and e-sign everything before finalizing the document."
  },
  {
    icon: <Share2 className="h-6 w-6 text-teal-600" />,
    title: "Easy Sharing",
    description: "Seamlessly share digital prescriptions with patients via secure links or email."
  },
  {
    icon: <BellRing className="h-6 w-6 text-teal-600" />,
    title: "Medication Reminders",
    description: "Automatically set up push notifications to remind patients to take their medications."
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-slate-50 relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-teal-600 mb-6">
            Everything you need for modern care
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            ClearNote is packed with features designed to save you time and improve patient outcomes.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={item}
              className="group relative bg-white p-8 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
              <div className="mb-6 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-teal-50 border border-teal-100 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
