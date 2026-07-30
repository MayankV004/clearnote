"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { ArrowLeft, Save, Loader2, UploadCloud, UserCircle, Stethoscope, Phone, MapPin, Building2, BookOpen } from "lucide-react";
import Link from "next/link";

// Types matching the backend Doctor model
interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  license_no: string | null;
  signature_url: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  speciality: string | null;
  years_of_experience: number | null;
  bio: string | null;
}

export default function SettingsPage() {
  const { user } = useUser();
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Local state for the form
  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");

  // Fetch the doctor's profile
  const { data: profile, isLoading } = useQuery<DoctorProfile>({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get("/doctors/me"),
  });

  // Pre-fill the form when data arrives
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(profile.name || "");
      setLicenseNo(profile.license_no || "");
      setSignatureUrl(profile.signature_url || "");
      setClinicName(profile.clinic_name || "");
      setClinicAddress(profile.clinic_address || "");
      setClinicPhone(profile.clinic_phone || "");
      setSpeciality(profile.speciality || "");
      setYearsOfExperience(profile.years_of_experience?.toString() || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Mutation to update the profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: { 
      name: string;
      license_no: string;
      clinic_name: string;
      clinic_address: string;
      clinic_phone: string;
      speciality: string;
      years_of_experience: number | null;
      bio: string;
    }) => 
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
      name,
      license_no: licenseNo,
      clinic_name: clinicName,
      clinic_address: clinicAddress,
      clinic_phone: clinicPhone,
      speciality,
      years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : null,
      bio
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      
      toast.loading("Uploading signature...", { id: "sig-upload" });
      api.post<{ signature_url: string }>("/doctors/me/signature", formData)
        .then((data) => {
          toast.success("Signature uploaded successfully!", { id: "sig-upload" });
          setSignatureUrl(data.signature_url);
          queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
        })
        .catch(() => {
          toast.error("Failed to upload signature.", { id: "sig-upload" });
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500/30">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-screen-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs text-slate-400 font-medium">Dashboard</p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Doctor Profile</h1>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-10">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Core Identity & Signature */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <UserCircle className="w-5 h-5 text-teal-600" /> Identity
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email (Read Only)</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user?.primaryEmailAddress?.emailAddress || ""} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Medical License No.</label>
                  <input 
                    type="text" 
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    placeholder="MD-12345678"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Signature Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <UploadCloud className="w-5 h-5 text-teal-600" /> Digital Signature
              </h2>
              {signatureUrl ? (
                <div className="text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signatureUrl} alt="Signature Preview" className="max-h-24 object-contain" />
                  </div>
                  <label className="inline-block cursor-pointer text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                    Upload New Signature
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-teal-500 mb-2 transition-colors" />
                  <span className="text-xs text-slate-500 font-medium px-4 text-center">Click to upload your signature (PNG, JPG)</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
              <p className="text-[11px] text-slate-400 mt-3 text-center leading-relaxed">
                This image will be automatically stamped on your generated prescription PDFs.
              </p>
            </div>
            
          </div>

          {/* Right Column - Clinical Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Professional Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Stethoscope className="w-5 h-5 text-indigo-500" /> Professional Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Speciality</label>
                  <input 
                    type="text" 
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Years of Experience</label>
                  <input 
                    type="number" 
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Professional Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your patients a little about your background, philosophy, and expertise..."
                  rows={4}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Clinic / Practice Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Building2 className="w-5 h-5 text-rose-500" /> Clinic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Clinic / Hospital Name</label>
                  <input 
                    type="text" 
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. City General Hospital"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Clinic Phone</label>
                  <input 
                    type="tel" 
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Clinic Address</label>
                <input 
                  type="text" 
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="123 Main St, New York, NY 10001"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                />
              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}
