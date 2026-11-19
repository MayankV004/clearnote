"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-in fade-in"
    >
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline. Changes cannot be saved until internet connectivity is restored.</span>
    </div>
  );
}
