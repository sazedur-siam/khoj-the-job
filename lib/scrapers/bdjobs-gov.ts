import type { ScrapeOutcome } from "./types";

const SOURCE = "bdjobs-gov";

export async function scrapeBdjobsGov(): Promise<ScrapeOutcome> {
  return {
    source: SOURCE,
    jobs: [],
    errors: [
      "bdjobs.com/h/jobs is an Angular SPA (legacy JobSearchEx.asp 404s); needs Playwright on a worker, or reverse-engineered JSON API. Not implemented in MVP.",
    ],
  };
}
