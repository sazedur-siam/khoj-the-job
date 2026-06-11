import { Suspense } from "react";
import {
  getCachedListing,
  getCachedStats,
  type CachedListing,
  type ListingFilters,
} from "@/lib/db/cached";
import type { JobStats } from "@/lib/db/jobs";
import { JobCategory, SourceType } from "@/lib/db/schemas";
import { CollapsibleFilters } from "./_components/CollapsibleFilters";
import { JobFilters } from "./_components/JobFilters";
import { JobsList } from "./_components/JobsList";
import { Hero } from "./_components/Hero";
import { ResultsFade } from "./_components/ResultsFade";

type SP = Record<string, string | string[] | undefined>;

function pickString(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

// Reading searchParams makes this route dynamic on every request, so the shell
// must stream immediately: everything that touches Mongo lives in the Suspense
// boundaries below and resolves from lib/db/cached.ts (no DB hit on cache hit).
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

  const filters: ListingFilters = { q, type, category, withinDays };
  const hasActiveFilters = !!(q || type || category || withinDays);

  return (
    <>
      <Suspense fallback={<HeroFallback />}>
        <HeroSection />
      </Suspense>

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
            <Suspense
              fallback={<ListingFallback hasActiveFilters={hasActiveFilters} />}
            >
              <ListingSection
                filters={filters}
                hasActiveFilters={hasActiveFilters}
              />
            </Suspense>
          </section>
        </div>
      </div>
    </>
  );
}

async function HeroSection() {
  let stats: JobStats | null = null;
  try {
    stats = await getCachedStats();
  } catch {
    // Stats are decorative — if Mongo is down the listing section reports it.
  }
  return stats && <Hero stats={stats} />;
}

function HeroFallback() {
  // Mirrors Hero's sticky bar dimensions so the swap doesn't shift layout.
  return (
    <section className="sticky top-[57px] z-20 border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-5 sm:py-2.5">
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-2 sm:h-5" />
      </div>
    </section>
  );
}

async function ListingSection({
  filters,
  hasActiveFilters,
}: {
  filters: ListingFilters;
  hasActiveFilters: boolean;
}) {
  let listing: CachedListing | null = null;
  let error: string | null = null;
  try {
    listing = await getCachedListing(filters);
  } catch (e) {
    error = (e as Error).message;
  }

  const signature = JSON.stringify(filters);

  return (
    <>
      <ListingHeader
        hasActiveFilters={hasActiveFilters}
        total={listing?.total ?? 0}
      />

      {error && (
        <div className="rounded-md border border-(--danger)/40 bg-(--danger)/5 p-4 text-sm text-danger">
          Could not load jobs: {error}
        </div>
      )}

      {listing && listing.cards.length === 0 && (
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

      {listing && listing.cards.length > 0 && (
        <ResultsFade>
          <JobsList jobs={listing.cards} signature={signature} />
        </ResultsFade>
      )}
    </>
  );
}

function ListingHeader({
  hasActiveFilters,
  total,
}: {
  hasActiveFilters: boolean;
  total: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
      <div className="min-w-0">
        <h2
          className="text-xl tracking-tight text-foreground sm:text-2xl md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hasActiveFilters ? "Filtered listings" : "Latest listings"}
        </h2>
        <div className="mt-1 h-[15px] font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">
          {total > 0 && (
            <>{total.toLocaleString()} matching · sorted newest first</>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingFallback({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <>
      <ListingHeader hasActiveFilters={hasActiveFilters} total={0} />
      <ul className="space-y-3" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <li
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </ul>
    </>
  );
}
