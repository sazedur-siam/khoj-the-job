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

export interface SearchResult {
  jobs: WithId<JobDoc>[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;

export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(params.pageSize ?? DEFAULT_PAGE_SIZE))
  );
  const db = await getDb();
  const col = db.collection<JobDoc>(COLLECTION);

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

  const [jobs, total] = await Promise.all([
    col
      .find(filter)
      .sort(q ? { score: { $meta: "textScore" }, postedAt: -1 } : { postedAt: -1, updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return { jobs, total, page, pageSize };
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
  const [total, gov, priv, intl, companies] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ sourceType: "gov" }),
    col.countDocuments({ sourceType: "private" }),
    col.countDocuments({ sourceType: "international" }),
    db.collection("companies").countDocuments({}),
  ]);
  return { total, gov, private: priv, international: intl, companies };
}
