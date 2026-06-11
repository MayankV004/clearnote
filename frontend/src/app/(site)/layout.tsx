"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const checkOnboarding = async () => {
      try {
        // Get the Clerk session token using the official hook — fully type-safe!
        const token = await getToken();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // If backend returns 404, the doctor record doesn't exist yet
        // (webhook may not have fired) — send them to onboarding
        if (res.status === 404) {
          router.replace("/onboarding");
          return;
        }

        if (res.ok) {
          const doctor = await res.json();

          // If doctor has not completed onboarding, force redirect!
          if (!doctor.is_onboarded) {
            router.replace("/onboarding");
          }
        }
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
      }
    };

    checkOnboarding();
  }, [isLoaded, user, router, getToken]);

  // Show nothing while we check — avoids a flash of the dashboard
  if (!isLoaded || !user) return null;

  return <>{children}</>;
}
