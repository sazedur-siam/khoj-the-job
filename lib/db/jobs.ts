import { ObjectId, type Filter, type WithId } from "mongodb";
import { getDb } from "./mongo";
import { jobHash } from "./hash";
import {
  type JobDoc,
  type NormalizedJob,
  NormalizedJobSchema,
  type SourceType,
  type JobCategory,
} from "./schemas";

const COLLECTION = "jobs";

export type UpsertResult = "inserted" | "updated" | "noop" | "invalid";

export async function upsertJob(input: NormalizedJob): Promise<UpsertResult> {
  const parsed = NormalizedJobSchema.safeParse(input);
  if (!parsed.success) return "invalid";
  const job = parsed.data;
  const hash = jobHash(job.source, job.sourceUrl);
  const now = new Date();
  const db = await getDb();

  const res = await db.collection<JobDoc>(COLLECTION).updateOne(
    { hash },
    {
      $set: { ...job, hash, updatedAt: now },
      $setOnInsert: { scrapedAt: now },
    },
    { upsert: true }
  );
  if (res.upsertedCount > 0) return "inserted";
  if (res.modifiedCount > 0) return "updated";
  return "noop";
}

export interface SearchParams {
  q?: string;
  type?: SourceType;
  category?: JobCategory;
  withinDays?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T = JobDoc> {
  jobs: WithId<T>[];
  total: number;
  page: number;
  pageSize: number;
}

/** Fields needed to render a listing card — excludes heavy fields like `description`. */
export type JobCardDoc = Omit<JobDoc, "description" | "rawTags" | "hash" | "sourceUrl" | "updatedAt">;

/** Client-safe card shape: ObjectId / Date converted to strings for RSC → client props. */
export interface JobCardData {
  _id: string;
  title: string;
  company: string;
  location: string | null;
  employmentType: string | null;
  category: JobCategory;
  sourceType: SourceType;
  source: string;
  applyUrl: string;
  postedAt: string | null;
  deadline: string | null;
  scrapedAt: string;
}

const CARD_PROJECTION = { description: 0, rawTags: 0, hash: 0, sourceUrl: 0, updatedAt: 0 } as const;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;

function buildFilter(params: SearchParams): Filter<JobDoc> {
  const filter: Filter<JobDoc> = {};
  if (params.type) filter.sourceType = params.type;
  if (params.category) filter.category = params.category;
  if (params.withinDays && params.withinDays > 0) {
    const cutoff = new Date(Date.now() - params.withinDays * 24 * 60 * 60 * 1000);
    filter.$or = [
      { postedAt: { $gte: cutoff } },
      { postedAt: null, scrapedAt: { $gte: cutoff } },
    ];
  }
  const q = params.q?.trim();
  if (q) filter.$text = { $search: q };
  return filter;
}

async function searchJobsImpl<T>(
  params: SearchParams,
  projection?: Record<string, 0 | 1>
): Promise<SearchResult<T>> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(params.pageSize ?? DEFAULT_PAGE_SIZE))
  );
  const db = await getDb();
  const col = db.collection<JobDoc>(COLLECTION);
  const filter = buildFilter(params);
  const q = params.q?.trim();

  let cursor = col
    .find(filter)
    .sort(q ? { score: { $meta: "textScore" }, postedAt: -1 } : { postedAt: -1, updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  if (projection) cursor = cursor.project(projection) as typeof cursor;

  const [jobs, total] = await Promise.all([cursor.toArray(), col.countDocuments(filter)]);

  return { jobs: jobs as unknown as WithId<T>[], total, page, pageSize };
}

export function searchJobs(params: SearchParams): Promise<SearchResult<JobDoc>> {
  return searchJobsImpl<JobDoc>(params);
}

/** Listing-page variant: same query, but only card fields come over the wire. */
export function searchJobCards(params: SearchParams): Promise<SearchResult<JobCardDoc>> {
  return searchJobsImpl<JobCardDoc>(params, { ...CARD_PROJECTION });
}

export function serializeJobCards(jobs: WithId<JobCardDoc>[]): JobCardData[] {
  return jobs.map((j) => ({
    _id: j._id.toString(),
    title: j.title,
    company: j.company,
    location: j.location ?? null,
    employmentType: j.employmentType ?? null,
    category: j.category,
    sourceType: j.sourceType,
    source: j.source,
    applyUrl: j.applyUrl,
    postedAt: j.postedAt instanceof Date ? j.postedAt.toISOString() : null,
    deadline: j.deadline instanceof Date ? j.deadline.toISOString() : null,
    scrapedAt: j.scrapedAt.toISOString(),
  }));
}

export async function getJobById(id: string): Promise<WithId<JobDoc> | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection<JobDoc>(COLLECTION).findOne({ _id: new ObjectId(id) });
}

export interface JobStats {
  total: number;
  gov: number;
  private: number;
  international: number;
  companies: number;
}

export async function getJobStats(): Promise<JobStats> {
  const db = await getDb();
  const col = db.collection<JobDoc>(COLLECTION);
  const [byType, companies] = await Promise.all([
    col
      .aggregate<{ _id: SourceType; count: number }>([
        { $group: { _id: "$sourceType", count: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection("companies").countDocuments({}),
  ]);
  const counts: Record<string, number> = {};
  for (const row of byType) counts[row._id] = row.count;
  const gov = counts.gov ?? 0;
  const priv = counts.private ?? 0;
  const intl = counts.international ?? 0;
  return { total: gov + priv + intl, gov, private: priv, international: intl, companies };
}
