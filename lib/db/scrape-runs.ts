import { getDb } from "./mongo";
import type { ScrapeRunDoc } from "./schemas";

export interface RunSummary {
  source: string;
  jobsFound: number;
  jobsNew: number;
  jobsUpdated: number;
  errors: string[];
}

export async function recordScrapeRun(
  startedAt: Date,
  summary: RunSummary
): Promise<void> {
  const db = await getDb();
  const doc: ScrapeRunDoc = {
    source: summary.source,
    startedAt,
    finishedAt: new Date(),
    jobsFound: summary.jobsFound,
    jobsNew: summary.jobsNew,
    jobsUpdated: summary.jobsUpdated,
    errors: summary.errors,
  };
  await db.collection<ScrapeRunDoc>("scrape_runs").insertOne(doc);
}
