import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getJobById } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

const BENGALI_RX = /[ঀ-৿]/;

function bnStyle(text: string): CSSProperties | undefined {
  return BENGALI_RX.test(text) ? { fontFamily: "var(--font-bengali)" } : undefined;
}

function bnClass(text: string): string {
  return BENGALI_RX.test(text) ? "font-bengali" : "";
}

function formatDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function relative(d: Date | string | null | undefined): string | null {
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

function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const typeMeta =
    job.sourceType === "gov"
      ? { label: "Government", accent: "var(--gov)", soft: "var(--gov-soft)" }
      : job.sourceType === "international"
      ? { label: "International", accent: "var(--intl)", soft: "var(--intl-soft)" }
      : { label: "Private", accent: "var(--private)", soft: "var(--private-soft)" };
  const accent = typeMeta.accent;
  const accentSoft = typeMeta.soft;
  const postedAgo = relative(job.postedAt) ?? relative(job.scrapedAt);
  const deadline = formatDate(job.deadline);
  const scrapedAgo = relative(job.scrapedAt);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] transition hover:text-[var(--accent)]"
      >
        ← Back to listings
      </Link>

      <div
        className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border)] px-6 py-3 text-[11px]">
          <span
            className="rounded-sm px-1.5 py-0.5 font-medium uppercase tracking-[0.18em]"
            style={{ background: accentSoft, color: accent }}
          >
            {typeMeta.label}
          </span>
          <span
            className="rounded-sm border border-[var(--border)] px-1.5 py-0.5 uppercase tracking-[0.18em] text-[var(--foreground-muted)]"
          >
            {job.category.replace("-", " ")}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--foreground-subtle)]">
            {postedAgo && <span>Posted {postedAgo}</span>}
            {deadline && (
              <span className="font-medium text-[var(--danger)]">Deadline {deadline}</span>
            )}
          </span>
        </div>

        <div className="px-6 pt-7 pb-6">
          <h1
            className={`text-3xl leading-[1.15] tracking-tight text-[var(--foreground)] sm:text-4xl ${bnClass(job.title)}`}
            style={{ fontFamily: "var(--font-display)", ...bnStyle(job.title) }}
          >
            {job.title}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold"
              style={{ background: accentSoft, color: accent }}
              aria-hidden
            >
              {initials(job.company) || "·"}
            </div>
            <div className="min-w-0 text-sm text-[var(--foreground-muted)]">
              <div
                className={`font-medium text-[var(--foreground)] ${bnClass(job.company)}`}
                style={bnStyle(job.company)}
              >
                {job.company}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--foreground-subtle)]">
                {job.location && <span>{job.location}</span>}
                {job.location && job.employmentType && <span>·</span>}
                {job.employmentType && <span>{job.employmentType}</span>}
              </div>
            </div>
          </div>

          {job.description && (
            <div
              className={`mt-7 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[15px] leading-relaxed text-[var(--foreground)] ${bnClass(job.description)}`}
              style={bnStyle(job.description)}
            >
              {job.description}
            </div>
          )}

          {job.rawTags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {job.rawTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--foreground-muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
            >
              Apply on source ↗
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border)] bg-[var(--surface-2)]/60 px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          <span>src · {job.source}</span>
          {scrapedAgo && <span>scraped · {scrapedAgo}</span>}
        </div>
      </div>
    </article>
  );
}
