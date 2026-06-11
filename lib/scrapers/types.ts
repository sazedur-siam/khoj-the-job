import type { NormalizedJob } from "../db/schemas";

export type { NormalizedJob };

export interface ScrapeOutcome {
  source: string;
  jobs: NormalizedJob[];
  errors: string[];
}

export function emptyOutcome(source: string): ScrapeOutcome {
  return { source, jobs: [], errors: [] };
}
