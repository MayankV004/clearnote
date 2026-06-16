/**
 * utils.ts
 *
 * Shared utility / helper functions used across multiple features.
 * Centralised here to avoid duplicating logic in individual page files.
 */

/**
 * Returns a human-readable relative time string from an ISO date string.
 * e.g. "3d ago", "2h ago", "Just now"
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

/**
 * Formats an ISO date string to a locale-friendly date string (en-IN).
 * Returns "—" for null/undefined values.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Calculates a person's age from their date of birth string.
 * Returns "—" if dob is null/undefined.
 */
export function calculateAge(dob: string | null | undefined): string {
  if (!dob) return "—";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} years`;
}

/**
 * Returns up to 2 uppercase initials from a full name string.
 * e.g. "Jane Doe" → "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Conditionally joins class names. Useful for dynamic Tailwind classes.
 * e.g. cn("base-class", condition && "conditional-class")
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
