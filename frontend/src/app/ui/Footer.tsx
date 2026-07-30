import React from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-teal-700 border-t border-teal-600 py-12">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start max-w-sm text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm group-hover:bg-teal-500 transition-colors">
                <Stethoscope className="h-6 w-6" />
              </div>
              <span className="text-3xl font-extrabold text-white tracking-tight">ClearNote</span>
            </Link>
            <p className="text-sm text-teal-100">
              AI-powered clinical documentation for modern medical professionals. Save time, improve accuracy, and focus on your patients.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-center md:text-left">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-teal-100">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#guide" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-teal-100">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-teal-600 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-teal-200">
            © {new Date().getFullYear()} ClearNote. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-teal-200">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
