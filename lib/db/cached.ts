import { unstable_cache } from "next/cache";
import { listAllCompanies } from "./companies";
import {
  getJobStats,
  searchJobCards,
  serializeJobCards,
  type JobCardData,
  type JobStats,
  type SearchParams,
} from "./jobs";

/**
 * Cross-request cache for the read path (Vercel Data Cache in prod). Data only
 * changes when crons write, and persistOutcome revalidates this tag after every
 * scrape — the TTL is just a safety net. unstable_cache JSON-serializes hits,
 * so everything returned here must already be plain data (no Date/ObjectId).
 */
export const JOBS_CACHE_TAG = "jobs";

const REVALIDATE_SECONDS = 300;

export interface CachedListing {
  cards: JobCardData[];
  total: number;
}

export type ListingFilters = Pick<SearchParams, "q" | "type" | "category" | "withinDays">;

export const getCachedListing = unstable_cache(
  async (filters: ListingFilters): Promise<CachedListing> => {
    const res = await searchJobCards({ ...filters, page: 1, pageSize: 500 });
    return { cards: serializeJobCards(res.jobs), total: res.total };
  },
  ["job-listing"],
  { revalidate: REVALIDATE_SECONDS, tags: [JOBS_CACHE_TAG] }
);

export const getCachedStats = unstable_cache(
  (): Promise<JobStats> => getJobStats(),
  ["job-stats"],
  { revalidate: REVALIDATE_SECONDS, tags: [JOBS_CACHE_TAG] }
);

export interface CompanyRow {
  _id: string;
  name: string;
  website: string | null;
  careersUrl: string | null;
  lastCrawlStatus: string | null;
}

export const getCachedCompanies = unstable_cache(
  async (): Promise<CompanyRow[]> => {
    const companies = await listAllCompanies();
    return companies.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      website: c.website ?? null,
      careersUrl: c.careersUrl ?? null,
      lastCrawlStatus: c.lastCrawlStatus ?? null,
    }));
  },
  ["companies-list"],
  { revalidate: REVALIDATE_SECONDS, tags: [JOBS_CACHE_TAG] }
);
