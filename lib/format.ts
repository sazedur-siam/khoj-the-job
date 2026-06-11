import type { SourceType } from "./db/schemas";

export function formatDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return formatDate(date);
}

export function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const BENGALI_RX = /[ঀ-৿]/;

export function isBengali(text: string): boolean {
  return BENGALI_RX.test(text);
}

/** Tailwind class that switches to the Bengali font when the text needs it. */
export function bnClass(text: string): string {
  return isBengali(text) ? "font-bengali" : "";
}

export const TYPE_META: Record<SourceType, { label: string; accent: string; soft: string }> = {
  gov: { label: "Government", accent: "var(--gov)", soft: "var(--gov-soft)" },
  private: { label: "Private", accent: "var(--private)", soft: "var(--private-soft)" },
  international: { label: "International", accent: "var(--intl)", soft: "var(--intl-soft)" },
};
