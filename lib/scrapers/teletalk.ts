import type { ScrapeOutcome } from "./types";

const SOURCE = "teletalk";

export async function scrapeTeletalk(): Promise<ScrapeOutcome> {
  return {
    source: SOURCE,
    jobs: [],
    errors: [
      "alljobs.teletalk.com.bd is a React SPA (empty #root div in HTML); needs Playwright on a worker, or reverse-engineered JSON API. Not implemented in MVP.",
    ],
  };
}
