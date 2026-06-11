import { fetchText } from "./http";
import { categorizeTitle } from "./filter-it";
import type { NormalizedJob, ScrapeOutcome } from "./types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function scrapeRemotive(): Promise<ScrapeOutcome> {
  const source = "remotive";
  const outcome: ScrapeOutcome = { source, jobs: [], errors: [] };
  try {
    const text = await fetchText(
      "https://remotive.com/api/remote-jobs?category=software-dev&limit=100",
      { timeoutMs: 20_000, headers: { accept: "application/json" } }
    );
    const data = JSON.parse(text) as {
      jobs?: Array<{
        url?: string;
        title?: string;
        company_name?: string;
        candidate_required_location?: string;
        job_type?: string;
        publication_date?: string;
        description?: string;
        tags?: string[];
      }>;
    };
    for (const j of data.jobs ?? []) {
      if (!j.title || !j.url) continue;
      const cat = categorizeTitle(j.title);
      if (!cat.matched) continue;
      outcome.jobs.push({
        title: j.title.trim(),
        company: j.company_name?.trim() || "Unknown",
        location: j.candidate_required_location?.trim() || "Remote",
        employmentType: j.job_type?.replace(/_/g, " ") || null,
        category: cat.category,
        description: stripHtml(j.description ?? "").slice(0, 2000),
        applyUrl: j.url,
        postedAt: j.publication_date ? new Date(j.publication_date) : null,
        deadline: null,
        source,
        sourceUrl: j.url,
        sourceType: "international",
        rawTags: (j.tags ?? []).slice(0, 20),
      });
    }
  } catch (e) {
    outcome.errors.push(`remotive: ${(e as Error).message}`);
  }
  return outcome;
}

async function scrapeArbeitnow(): Promise<ScrapeOutcome> {
  const source = "arbeitnow";
  const outcome: ScrapeOutcome = { source, jobs: [], errors: [] };
  try {
    const text = await fetchText("https://www.arbeitnow.com/api/job-board-api", {
      timeoutMs: 20_000,
      headers: { accept: "application/json" },
    });
    const data = JSON.parse(text) as {
      data?: Array<{
        slug?: string;
        company_name?: string;
        title?: string;
        description?: string;
        remote?: boolean;
        url?: string;
        tags?: string[];
        job_types?: string[];
        location?: string;
        created_at?: number;
      }>;
    };
    for (const j of data.data ?? []) {
      if (!j.title || !j.url || !j.remote) continue;
      const cat = categorizeTitle(j.title);
      if (!cat.matched) continue;
      outcome.jobs.push({
        title: j.title.trim(),
        company: j.company_name?.trim() || "Unknown",
        location: j.location?.trim() ? `Remote · ${j.location.trim()}` : "Remote",
        employmentType: j.job_types?.join(", ") || null,
        category: cat.category,
        description: stripHtml(j.description ?? "").slice(0, 2000),
        applyUrl: j.url,
        postedAt: j.created_at ? new Date(j.created_at * 1000) : null,
        deadline: null,
        source,
        sourceUrl: j.url,
        sourceType: "international",
        rawTags: (j.tags ?? []).slice(0, 20),
      });
    }
  } catch (e) {
    outcome.errors.push(`arbeitnow: ${(e as Error).message}`);
  }
  return outcome;
}

export async function scrapeInternational(): Promise<ScrapeOutcome[]> {
  const [remotive, arbeitnow] = await Promise.all([scrapeRemotive(), scrapeArbeitnow()]);
  return [remotive, arbeitnow];
}
