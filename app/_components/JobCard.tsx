import type { JobCardData } from "@/lib/db/jobs";
import { bnClass, formatDate, initials, relativeDate, TYPE_META } from "@/lib/format";

export function JobCard({ job }: { job: JobCardData }) {
  const meta = TYPE_META[job.sourceType];
  const posted = relativeDate(job.postedAt) ?? relativeDate(job.scrapedAt);
  const deadline = formatDate(job.deadline);
  const accent = meta.accent;
  const accentSoft = meta.soft;

  return (
    <li className="group relative">
      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-border bg-surface transition hover:border-border-strong hover:shadow-md"
      >
        <div
          className="absolute left-0 top-0 h-full w-1 transition group-hover:w-1.5"
          style={{ background: accent }}
        />
        <div className="flex gap-4 p-4 pl-5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold"
            style={{ background: accentSoft, color: accent }}
            aria-hidden
          >
            {initials(job.company) || "·"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                {meta.label}
              </span>
              <span className="text-[10px] text-foreground-subtle">·</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-foreground-subtle">
                {job.category.replace("-", " ")}
              </span>
            </div>
            <h3
              className={`text-base font-medium leading-snug text-foreground group-hover:text-accent ${bnClass(
                job.title
              )}`}
            >
              {job.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
              <span className={`font-medium ${bnClass(job.company)}`}>{job.company}</span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <DotIcon /> {job.location}
                </span>
              )}
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <DotIcon /> {job.employmentType}
                </span>
              )}
            </div>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1 text-right text-[11px] text-foreground-subtle sm:flex">
            {posted && <span>{posted}</span>}
            {deadline && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-danger">
                Deadline {deadline}
              </span>
            )}
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--foreground-subtle)" }}
            >
              {job.source}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-accent opacity-0 transition group-hover:opacity-100">
              Open ↗
            </span>
          </div>
        </div>
      </a>
    </li>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 4 4" className="h-1 w-1" aria-hidden>
      <circle cx="2" cy="2" r="2" fill="currentColor" />
    </svg>
  );
}
