import { upsertJob } from "./db/jobs";
import { recordScrapeRun } from "./db/scrape-runs";
import type { ScrapeOutcome } from "./scrapers/types";

export interface PersistedSummary {
  source: string;
  jobsFound: number;
  jobsNew: number;
  jobsUpdated: number;
  jobsInvalid: number;
  errors: string[];
}

export async function persistOutcome(
  outcome: ScrapeOutcome,
  startedAt: Date
): Promise<PersistedSummary> {
  let inserted = 0;
  let updated = 0;
  let invalid = 0;
  const errors = [...outcome.errors];

  for (const job of outcome.jobs) {
    try {
      const res = await upsertJob(job);
      if (res === "inserted") inserted++;
      else if (res === "updated") updated++;
      else if (res === "invalid") invalid++;
    } catch (e) {
      errors.push(`upsert ${job.title}: ${(e as Error).message}`);
    }
  }

  const summary: PersistedSummary = {
    source: outcome.source,
    jobsFound: outcome.jobs.length,
    jobsNew: inserted,
    jobsUpdated: updated,
    jobsInvalid: invalid,
    errors,
  };

  await recordScrapeRun(startedAt, {
    source: summary.source,
    jobsFound: summary.jobsFound,
    jobsNew: summary.jobsNew,
    jobsUpdated: summary.jobsUpdated,
    errors: summary.errors,
  });

  return summary;
}
