import { type WithId } from "mongodb";
import { getDb } from "./mongo";
import type { CompanyDoc } from "./schemas";

const COLLECTION = "companies";

export const COMPANY_BATCH_SIZE = 15;

export async function upsertCompany(
  c: Pick<CompanyDoc, "name" | "website" | "linkedin" | "techStack">
): Promise<void> {
  const db = await getDb();
  await db.collection<CompanyDoc>(COLLECTION).updateOne(
    { name: c.name },
    {
      $set: { website: c.website, linkedin: c.linkedin, techStack: c.techStack },
      $setOnInsert: {
        name: c.name,
        careersUrl: null,
        lastCrawledAt: null,
        lastCrawlStatus: null,
        lastCrawlError: null,
      },
    },
    { upsert: true }
  );
}

export async function listCompanyBatch(
  batchIndex: number,
  batchSize = COMPANY_BATCH_SIZE
): Promise<WithId<CompanyDoc>[]> {
  const db = await getDb();
  return db
    .collection<CompanyDoc>(COLLECTION)
    .find({})
    .sort({ name: 1 })
    .skip(batchIndex * batchSize)
    .limit(batchSize)
    .toArray();
}

export async function totalCompanyCount(): Promise<number> {
  const db = await getDb();
  return db.collection<CompanyDoc>(COLLECTION).countDocuments({});
}

export async function listAllCompanies(): Promise<WithId<CompanyDoc>[]> {
  const db = await getDb();
  return db.collection<CompanyDoc>(COLLECTION).find({}).sort({ name: 1 }).toArray();
}

export async function updateCompanyCrawlState(
  name: string,
  patch: Partial<Pick<CompanyDoc, "careersUrl" | "lastCrawlStatus" | "lastCrawlError">>
): Promise<void> {
  const db = await getDb();
  await db
    .collection<CompanyDoc>(COLLECTION)
    .updateOne({ name }, { $set: { ...patch, lastCrawledAt: new Date() } });
}
