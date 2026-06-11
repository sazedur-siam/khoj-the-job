import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { CSSProperties } from "react";
import { getJobById } from "@/lib/db/jobs";
import { bnClass, formatDate, initials, isBengali, relativeDate, TYPE_META } from "@/lib/format";

export const revalidate = 300;

const getJob = cache(getJobById);

function bnStyle(text: string): CSSProperties | undefined {
  return isBengali(text) ? { fontFamily: "var(--font-bengali)" } : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found · Khoj" };
  return {
    title: `${job.title} — ${job.company} · Khoj`,
    description:
      job.description.slice(0, 160) ||
      `${job.title} at ${job.company}${job.location ? `, ${job.location}` : ""}.`,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const typeMeta = TYPE_META[job.sourceType];
  const accent = typeMeta.accent;
  const accentSoft = typeMeta.soft;
  const postedAgo = relativeDate(job.postedAt) ?? relativeDate(job.scrapedAt);
  const deadline = formatDate(job.deadline);
  const scrapedAgo = relativeDate(job.scrapedAt);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-foreground-subtle transition hover:text-accent"
      >
        ← Back to listings
      </Link>

      <div
        className="overflow-hidden rounded-lg border border-border bg-surface"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-6 py-3 text-[11px]">
          <span
            className="rounded-sm px-1.5 py-0.5 font-medium uppercase tracking-[0.18em]"
            style={{ background: accentSoft, color: accent }}
          >
            {typeMeta.label}
          </span>
          <span
            className="rounded-sm border border-border px-1.5 py-0.5 uppercase tracking-[0.18em] text-foreground-muted"
          >
            {job.category.replace("-", " ")}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-foreground-subtle">
            {postedAgo && <span>Posted {postedAgo}</span>}
            {deadline && (
              <span className="font-medium text-danger">Deadline {deadline}</span>
            )}
          </span>
        </div>

        <div className="px-6 pt-7 pb-6">
          <h1
            className={`text-3xl leading-[1.15] tracking-tight text-foreground sm:text-4xl ${bnClass(job.title)}`}
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
            <div className="min-w-0 text-sm text-foreground-muted">
              <div
                className={`font-medium text-foreground ${bnClass(job.company)}`}
                style={bnStyle(job.company)}
              >
                {job.company}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-foreground-subtle">
                {job.location && <span>{job.location}</span>}
                {job.location && job.employmentType && <span>·</span>}
                {job.employmentType && <span>{job.employmentType}</span>}
              </div>
            </div>
          </div>

          {job.description && (
            <div
              className={`mt-7 whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-5 text-[15px] leading-relaxed text-foreground ${bnClass(job.description)}`}
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
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-foreground-muted"
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
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              Apply on source ↗
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-(--surface-2)/60 px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
          <span>src · {job.source}</span>
          {scrapedAgo && <span>scraped · {scrapedAgo}</span>}
        </div>
      </div>
    </article>
  );
}
