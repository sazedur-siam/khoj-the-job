import { MongoClient, type Db } from "mongodb";

type CachedMongo = { client: MongoClient; db: Db; indexesEnsured: boolean };

const globalCache = globalThis as unknown as {
  __khojMongo?: Promise<CachedMongo>;
};

async function connect(): Promise<CachedMongo> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "khoj";
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });
  await client.connect();
  const db = client.db(dbName);
  return { client, db, indexesEnsured: false };
}

function getCached(): Promise<CachedMongo> {
  if (!globalCache.__khojMongo) {
    // Drop a failed connection promise so the next request retries instead of
    // serving the cached rejection for the lifetime of the lambda.
    globalCache.__khojMongo = connect().catch((e) => {
      globalCache.__khojMongo = undefined;
      throw e;
    });
  }
  return globalCache.__khojMongo;
}

export async function getDb(): Promise<Db> {
  return (await getCached()).db;
}

/**
 * Creates/verifies all indexes (once per process). Only the write path —
 * scrapers via persistOutcome, the seed script — calls this; readers must not
 * pay index-creation round-trips on cold start.
 */
export async function ensureIndexes(): Promise<void> {
  const cached = await getCached();
  if (cached.indexesEnsured) return;
  cached.indexesEnsured = true;
  const db = cached.db;
  await Promise.all([
    db.collection("jobs").createIndex({ hash: 1 }, { unique: true }),
    db.collection("jobs").createIndex({ postedAt: -1 }),
    db.collection("jobs").createIndex({ sourceType: 1, category: 1 }),
    db.collection("jobs").createIndex(
      { title: "text", company: "text", description: "text" },
      { name: "jobs_text", default_language: "english" }
    ),
    db.collection("companies").createIndex({ name: 1 }, { unique: true }),
    db.collection("scrape_runs").createIndex({ startedAt: -1 }),
  ]);
}
