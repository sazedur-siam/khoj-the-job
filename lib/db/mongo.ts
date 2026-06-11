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

async function ensureIndexes(db: Db): Promise<void> {
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

export async function getDb(): Promise<Db> {
  if (!globalCache.__khojMongo) {
    globalCache.__khojMongo = connect();
  }
  const cached = await globalCache.__khojMongo;
  if (!cached.indexesEnsured) {
    cached.indexesEnsured = true;
    await ensureIndexes(cached.db);
  }
  return cached.db;
}
