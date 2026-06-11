"use client";

import { useEffect, useMemo, useState } from "react";
import type { WithId } from "mongodb";
import type { JobDoc } from "@/lib/db/schemas";
import { JobCard } from "./JobCard";

const PAGE_SIZE = 20;

interface SerializableJob extends Omit<WithId<JobDoc>, "_id" | "postedAt" | "deadline" | "scrapedAt" | "updatedAt"> {
  _id: string;
  postedAt: string | null;
  deadline: string | null;
  scrapedAt: string;
  updatedAt: string;
}

export function JobsList({ jobs, signature }: { jobs: SerializableJob[]; signature: string }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [signature]);

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const startIdx = (clampedPage - 1) * PAGE_SIZE;
  const visible = useMemo(
    () => jobs.slice(startIdx, startIdx + PAGE_SIZE),
    [jobs, startIdx]
  );

  function goTo(p: number) {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (jobs.length === 0) return null;

  const numbers = buildPages(clampedPage, totalPages);

  return (
    <>
      <ul className="space-y-3">
        {visible.map((j) => (
          <JobCard key={j._id} job={revive(j)} />
        ))}
      </ul>

      <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
        Showing {(startIdx + 1).toLocaleString()}–
        {Math.min(startIdx + PAGE_SIZE, jobs.length).toLocaleString()} of{" "}
        {jobs.length.toLocaleString()}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-4 flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row"
        >
          <PageBtn disabled={clampedPage <= 1} onClick={() => goTo(clampedPage - 1)}>
            <span aria-hidden className="mr-1">←</span> Previous
          </PageBtn>

          <ul className="hidden items-center gap-1 sm:flex">
            {numbers.map((n, i) =>
              n === "…" ? (
                <li
                  key={`gap-${i}`}
                  className="px-1 font-mono text-xs text-[var(--foreground-subtle)]"
                  aria-hidden
                >
                  ·
                </li>
              ) : (
                <li key={n}>
                  <button
                    type="button"
                    aria-current={n === clampedPage ? "page" : undefined}
                    onClick={() => goTo(n)}
                    className={
                      n === clampedPage
                        ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-2 font-mono text-xs text-[var(--accent-foreground)]"
                        : "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 font-mono text-xs text-[var(--foreground-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }
                  >
                    {n}
                  </button>
                </li>
              )
            )}
          </ul>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-subtle)] sm:hidden">
            Page {clampedPage} of {totalPages}
          </span>

          <PageBtn
            disabled={clampedPage >= totalPages}
            onClick={() => goTo(clampedPage + 1)}
          >
            Next <span aria-hidden className="ml-1">→</span>
          </PageBtn>
        </nav>
      )}
    </>
  );
}

function PageBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        disabled
          ? "inline-flex cursor-not-allowed items-center justify-center rounded-full border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-medium text-[var(--foreground-subtle)] opacity-50"
          : "inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      }
    >
      {children}
    </button>
  );
}

function buildPages(current: number, total: number): Array<number | "…"> {
  if (total <= 1) return [];
  const out: Array<number | "…"> = [];
  const from = Math.max(2, current - 2);
  const to = Math.min(total - 1, current + 2);
  out.push(1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("…");
  if (total > 1) out.push(total);
  return out;
}

function revive(j: SerializableJob): WithId<JobDoc> {
  const toDate = (s: string | null) => (s ? new Date(s) : null);
  return {
    ...j,
    _id: j._id as unknown as WithId<JobDoc>["_id"],
    postedAt: toDate(j.postedAt),
    deadline: toDate(j.deadline),
    scrapedAt: new Date(j.scrapedAt),
    updatedAt: new Date(j.updatedAt),
  } as WithId<JobDoc>;
}

export function serializeJobs(jobs: WithId<JobDoc>[]): SerializableJob[] {
  return jobs.map((j) => ({
    ...j,
    _id: j._id.toString(),
    postedAt: j.postedAt instanceof Date ? j.postedAt.toISOString() : null,
    deadline: j.deadline instanceof Date ? j.deadline.toISOString() : null,
    scrapedAt: j.scrapedAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  }));
}
