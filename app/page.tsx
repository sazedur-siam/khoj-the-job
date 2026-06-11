import { Suspense } from "react";
import { searchJobCards, getJobStats, serializeJobCards } from "@/lib/db/jobs";
import { JobCategory, SourceType } from "@/lib/db/schemas";
import { CollapsibleFilters } from "./_components/CollapsibleFilters";
import { JobFilters } from "./_components/JobFilters";
import { JobsList } from "./_components/JobsList";
import { Hero } from "./_components/Hero";
import { ResultsFade } from "./_components/ResultsFade";

export const revalidate = 60;

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

  let listing: Awaited<ReturnType<typeof searchJobCards>> | null = null;
  let stats: Awaited<ReturnType<typeof getJobStats>> | null = null;
  let error: string | null = null;
  try {
    [listing, stats] = await Promise.all([
      searchJobCards({ q, type, category, withinDays, page: 1, pageSize: 500 }),
      getJobStats(),
    ]);
  } catch (e) {
    error = (e as Error).message;
  }

  const hasActiveFilters = !!(q || type || category || withinDays);
  const signature = JSON.stringify({ q, type, category, withinDays });
  const serialized = listing ? serializeJobCards(listing.jobs) : [];

  return (
    <>
      {stats && <Hero stats={stats} />}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-[110px] lg:self-start">
            <div className="mb-3 hidden text-[10px] uppercase tracking-[0.22em] text-foreground-subtle lg:block">
              Refine
            </div>
            <Suspense
              fallback={
                <div className="h-48 animate-pulse rounded-md bg-surface-2" />
              }
            >
              <CollapsibleFilters>
                <JobFilters />
              </CollapsibleFilters>
            </Suspense>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div className="min-w-0">
                <h2
                  className="text-xl tracking-tight text-foreground sm:text-2xl md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {hasActiveFilters ? "Filtered listings" : "Latest listings"}
                </h2>
                {listing && listing.total > 0 && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">
                    {listing.total.toLocaleString()} matching · sorted newest first
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-(--danger)/40 bg-(--danger)/5 p-4 text-sm text-danger">
                Could not load jobs: {error}
              </div>
            )}

            {listing && serialized.length === 0 && (
              <div className="rounded-md border border-dashed border-border-strong bg-surface p-8 text-center">
                <div
                  className="mb-2 text-2xl tracking-tight text-foreground-muted"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Nothing here yet.
                </div>
                <div className="text-sm text-foreground-subtle">
                  {hasActiveFilters
                    ? "Try clearing filters, widening the date range, or searching for a broader role."
                    : "The next scrape run will populate listings."}
                </div>
              </div>
            )}

            {listing && serialized.length > 0 && (
              <ResultsFade>
                <JobsList jobs={serialized} signature={signature} />
              </ResultsFade>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
