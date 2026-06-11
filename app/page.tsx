import { Suspense } from "react";
import { searchJobs, getJobStats } from "@/lib/db/jobs";
import { JobCategory, SourceType } from "@/lib/db/schemas";
import { JobFilters } from "./_components/JobFilters";
import { JobCard } from "./_components/JobCard";
import { Pagination } from "./_components/Pagination";
import { Hero } from "./_components/Hero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

function pickString(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = pickString(sp, "q");
  const typeRaw = pickString(sp, "type");
  const categoryRaw = pickString(sp, "category");
  const withinRaw = pickString(sp, "within");
  const pageRaw = pickString(sp, "page");

  const type =
    typeRaw && SourceType.safeParse(typeRaw).success
      ? (typeRaw as ReturnType<typeof SourceType.parse>)
      : undefined;
  const category =
    categoryRaw && JobCategory.safeParse(categoryRaw).success
      ? (categoryRaw as ReturnType<typeof JobCategory.parse>)
      : undefined;
  const within = withinRaw ? parseInt(withinRaw, 10) : undefined;
  const withinDays = within && within > 0 ? within : undefined;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  let listing: Awaited<ReturnType<typeof searchJobs>> | null = null;
  let stats: Awaited<ReturnType<typeof getJobStats>> | null = null;
  let error: string | null = null;
  try {
    [listing, stats] = await Promise.all([
      searchJobs({ q, type, category, withinDays, page }),
      getJobStats(),
    ]);
  } catch (e) {
    error = (e as Error).message;
  }

  const flatParams: Record<string, string | undefined> = {
    q,
    type,
    category,
    within: withinDays ? String(withinDays) : undefined,
  };

  const hasActiveFilters = !!(q || type || category || withinDays);

  return (
    <>
      {stats && <Hero stats={stats} />}

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[210px] lg:self-start">
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
              Refine
            </div>
            <Suspense
              fallback={
                <div className="h-48 animate-pulse rounded-md bg-[var(--surface-2)]" />
              }
            >
              <JobFilters />
            </Suspense>
          </aside>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <h2
                  className="text-2xl tracking-tight text-[var(--foreground)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {hasActiveFilters ? "Filtered listings" : "Latest listings"}
                </h2>
                {listing && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                    {listing.total.toLocaleString()} matching · sorted newest first
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
                Could not load jobs: {error}
              </div>
            )}

            {listing && listing.jobs.length === 0 && (
              <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
                <div
                  className="mb-2 text-2xl tracking-tight text-[var(--foreground-muted)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Nothing here yet.
                </div>
                <div className="text-sm text-[var(--foreground-subtle)]">
                  {hasActiveFilters
                    ? "Try clearing filters, widening the date range, or searching for a broader role."
                    : "The next scrape run will populate listings. Government circulars run nightly; private companies hourly."}
                </div>
              </div>
            )}

            {listing && listing.jobs.length > 0 && (
              <>
                <ul className="space-y-3">
                  {listing.jobs.map((job) => (
                    <JobCard key={job._id.toString()} job={job} />
                  ))}
                </ul>
                <div className="mt-8">
                  <Pagination
                    page={listing.page}
                    pageSize={listing.pageSize}
                    total={listing.total}
                    searchParams={flatParams}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
