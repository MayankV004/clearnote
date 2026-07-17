"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";


// Types matching the backend Doctor model
interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  license_no: string | null;
  signature_url: string | null;
}

export default function SettingsPage() {
  const { user } = useUser();
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Local state for the form
  const [licenseNo, setLicenseNo] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  // Fetch the doctor's profile
  const { data: profile, isLoading } = useQuery<DoctorProfile>({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get("/doctors/me"),
  });

  // Pre-fill the form when data arrives
  useEffect(() => {
    if (profile) {
      setLicenseNo(profile.license_no || "");
      setSignatureUrl(profile.signature_url || "");
    }
  }, [profile]);

  // Mutation to update the profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: { license_no: string; signature_url: string }) => 
      api.patch("/doctors/me", data),
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
    },
    onError: () => {
      toast.error("Failed to save settings. Please try again.");
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ 
      license_no: licenseNo, 
      signature_url: signatureUrl 
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex justify-center mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Doctor Profile Settings</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Email (Read Only from Clerk) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="text" 
              disabled 
              value={user?.primaryEmailAddress?.emailAddress || ""} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email is managed via your Clerk account.</p>
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medical License Number</label>
            <input 
              type="text" 
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="e.g. MD-12345678"
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Signature Upload Placeholder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Digital Signature URL</label>
            <input 
              type="text" 
              value={signatureUrl}
              onChange={(e) => setSignatureUrl(e.target.value)}
              placeholder="https://example.com/my-signature.png"
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">This signature will be automatically stamped onto your prescription PDFs.</p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
