import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { fetchText, jitter } from "./http";
import { categorizeTitle } from "./filter-it";
import { updateCompanyCrawlState } from "../db/companies";
import type { NormalizedJob, ScrapeOutcome } from "./types";
import type { CompanyDoc } from "../db/schemas";
import type { WithId } from "mongodb";

const CAREERS_LINK_PATTERNS = [
  /\/careers?(\/|$|\?|#)/i,
  /\/jobs?(\/|$|\?|#)/i,
  /\/vacanc/i,
  /\/join[-_]?us/i,
  /\/work[-_]?with[-_]?us/i,
  /\/hiring/i,
  /\/opportunities/i,
];
const CAREERS_TEXT_PATTERNS = /career|join us|we'?re hiring|open positions|vacanc|work with us/i;

const MAX_PAGE_BYTES = 250_000;
const MAX_LLM_INPUT_CHARS = 18_000;

function companySource(name: string): string {
  return `company:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function absUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function findCareersUrl(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: string[] = [];
  $("a[href]").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href")?.trim() ?? "";
    const text = $a.text().trim();
    if (!href) return;
    const abs = absUrl(href, baseUrl);
    if (!abs) return;
    if (CAREERS_LINK_PATTERNS.some((rx) => rx.test(abs))) {
      candidates.unshift(abs);
      return;
    }
    if (CAREERS_TEXT_PATTERNS.test(text)) {
      candidates.push(abs);
    }
  });
  return candidates[0] ?? null;
}

interface AtsHit {
  vendor: "greenhouse" | "lever" | "workable";
  slug: string;
}

function detectAts(html: string): AtsHit | null {
  let m: RegExpExecArray | null;
  m = /boards\.greenhouse\.io\/([a-z0-9_-]+)/i.exec(html);
  if (m) return { vendor: "greenhouse", slug: m[1] };
  m = /jobs\.lever\.co\/([a-z0-9_-]+)/i.exec(html);
  if (m) return { vendor: "lever", slug: m[1] };
  m = /apply\.workable\.com\/([a-z0-9_-]+)/i.exec(html);
  if (m) return { vendor: "workable", slug: m[1] };
  return null;
}

async function fetchAtsJobs(
  ats: AtsHit,
  company: CompanyDoc
): Promise<NormalizedJob[]> {
  const source = companySource(company.name);
  const jobs: NormalizedJob[] = [];

  if (ats.vendor === "greenhouse") {
    const url = `https://boards-api.greenhouse.io/v1/boards/${ats.slug}/jobs?content=true`;
    const text = await fetchText(url, { timeoutMs: 15_000 });
    const data = JSON.parse(text) as {
      jobs?: Array<{
        title?: string;
        absolute_url?: string;
        location?: { name?: string };
        updated_at?: string;
        content?: string;
      }>;
    };
    for (const j of data.jobs ?? []) {
      if (!j.title || !j.absolute_url) continue;
      const cat = categorizeTitle(j.title);
      if (!cat.matched) continue;
      jobs.push({
        title: j.title.trim(),
        company: company.name,
        location: j.location?.name?.trim() || null,
        employmentType: null,
        category: cat.category,
        description: (j.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
        applyUrl: j.absolute_url,
        postedAt: j.updated_at ? new Date(j.updated_at) : null,
        deadline: null,
        source,
        sourceUrl: j.absolute_url,
        sourceType: "private",
        rawTags: company.techStack ?? [],
      });
    }
  } else if (ats.vendor === "lever") {
    const url = `https://api.lever.co/v0/postings/${ats.slug}?mode=json`;
    const text = await fetchText(url, { timeoutMs: 15_000 });
    const data = JSON.parse(text) as Array<{
      text?: string;
      hostedUrl?: string;
      applyUrl?: string;
      categories?: { location?: string; commitment?: string };
      createdAt?: number;
      descriptionPlain?: string;
    }>;
    for (const j of data) {
      if (!j.text || !(j.hostedUrl || j.applyUrl)) continue;
      const cat = categorizeTitle(j.text);
      if (!cat.matched) continue;
      const link = (j.hostedUrl || j.applyUrl)!;
      jobs.push({
        title: j.text.trim(),
        company: company.name,
        location: j.categories?.location?.trim() || null,
        employmentType: j.categories?.commitment?.trim() || null,
        category: cat.category,
        description: (j.descriptionPlain ?? "").replace(/\s+/g, " ").trim().slice(0, 2000),
        applyUrl: link,
        postedAt: j.createdAt ? new Date(j.createdAt) : null,
        deadline: null,
        source,
        sourceUrl: link,
        sourceType: "private",
        rawTags: company.techStack ?? [],
      });
    }
  } else if (ats.vendor === "workable") {
    const url = `https://apply.workable.com/api/v3/accounts/${ats.slug}/jobs`;
    const text = await fetchText(url, {
      timeoutMs: 15_000,
      headers: { accept: "application/json" },
    });
    const data = JSON.parse(text) as {
      results?: Array<{
        title?: string;
        shortcode?: string;
        url?: string;
        country?: string;
        city?: string;
        employment_type?: string;
        created_at?: string;
        description?: string;
      }>;
    };
    for (const j of data.results ?? []) {
      if (!j.title) continue;
      const cat = categorizeTitle(j.title);
      if (!cat.matched) continue;
      const link =
        j.url ??
        (j.shortcode ? `https://apply.workable.com/${ats.slug}/j/${j.shortcode}/` : null);
      if (!link) continue;
      jobs.push({
        title: j.title.trim(),
        company: company.name,
        location: [j.city, j.country].filter(Boolean).join(", ") || null,
        employmentType: j.employment_type || null,
        category: cat.category,
        description: (j.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
        applyUrl: link,
        postedAt: j.created_at ? new Date(j.created_at) : null,
        deadline: null,
        source,
        sourceUrl: link,
        sourceType: "private",
        rawTags: company.techStack ?? [],
      });
    }
  }

  return jobs;
}

interface JsonLdJob {
  title?: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string | string[];
  hiringOrganization?: { name?: string } | string;
  jobLocation?: unknown;
  url?: string;
  applicantLocationRequirements?: unknown;
}

function flattenLocation(loc: unknown): string | null {
  if (!loc) return null;
  const arr = Array.isArray(loc) ? loc : [loc];
  const parts: string[] = [];
  for (const l of arr) {
    if (typeof l !== "object" || l === null) continue;
    const obj = l as { address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } };
    const a = obj.address;
    if (a) {
      const bit = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ");
      if (bit) parts.push(bit);
    }
  }
  return parts.length ? parts.join(" / ") : null;
}

function extractJsonLdJobs(html: string, fallbackUrl: string, company: CompanyDoc): NormalizedJob[] {
  const $ = cheerio.load(html);
  const out: NormalizedJob[] = [];
  const source = companySource(company.name);

  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const nodes: unknown[] = [];
    const visit = (n: unknown) => {
      if (!n || typeof n !== "object") return;
      const obj = n as { "@type"?: string | string[]; "@graph"?: unknown[] };
      const type = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
      if (type.includes("JobPosting")) nodes.push(obj);
      if (Array.isArray(obj["@graph"])) obj["@graph"].forEach(visit);
      if (Array.isArray(n)) n.forEach(visit);
    };
    if (Array.isArray(data)) data.forEach(visit);
    else visit(data);

    for (const node of nodes) {
      const j = node as JsonLdJob;
      const title = (j.title ?? "").toString().trim();
      if (!title) continue;
      const cat = categorizeTitle(title);
      if (!cat.matched) continue;
      const applyUrl = (j.url ?? fallbackUrl).toString();
      const emp = Array.isArray(j.employmentType) ? j.employmentType.join(", ") : j.employmentType ?? null;
      out.push({
        title,
        company: company.name,
        location: flattenLocation(j.jobLocation),
        employmentType: emp ?? null,
        category: cat.category,
        description: (j.description ?? "").toString().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
        applyUrl,
        postedAt: j.datePosted ? new Date(j.datePosted) : null,
        deadline: j.validThrough ? new Date(j.validThrough) : null,
        source,
        sourceUrl: applyUrl,
        sourceType: "private",
        rawTags: company.techStack ?? [],
      });
    }
  });

  return out;
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, header, footer, nav, svg, iframe").remove();
  const main = $("main").first().text() || $("body").text() || $.text();
  return main.replace(/\s+/g, " ").trim().slice(0, MAX_LLM_INPUT_CHARS);
}

interface ExtractedJob {
  title: string;
  location?: string | null;
  employment_type?: string | null;
  apply_url?: string | null;
  description?: string | null;
}

const EXTRACTION_TOOL = {
  name: "submit_jobs",
  description: "Submit the list of open job postings found on the careers page.",
  input_schema: {
    type: "object" as const,
    properties: {
      jobs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            location: { type: "string", nullable: true },
            employment_type: { type: "string", nullable: true },
            apply_url: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
          },
          required: ["title"],
        },
      },
    },
    required: ["jobs"],
  },
};

async function extractJobsWithLLM(
  client: Anthropic,
  companyName: string,
  pageText: string,
  pageUrl: string
): Promise<ExtractedJob[]> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    tool_choice: { type: "tool", name: "submit_jobs" },
    tools: [EXTRACTION_TOOL],
    messages: [
      {
        role: "user",
        content: `You are extracting job postings from a company careers page.

Company: ${companyName}
Source URL: ${pageUrl}

Page text (truncated):
"""
${pageText}
"""

Rules:
- Only include CURRENTLY OPEN positions actually listed on this page.
- Do not invent jobs. If you cannot find clearly-listed open roles, return an empty jobs array.
- For apply_url, if a per-role URL exists on the page use it; otherwise use the page URL itself.
- Keep descriptions to 1-3 sentences max.

Call the submit_jobs tool with what you find.`,
      },
    ],
  });

  const toolUse = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) return [];
  const input = toolUse.input as { jobs?: ExtractedJob[] };
  return Array.isArray(input.jobs) ? input.jobs : [];
}

function llmJobsToNormalized(
  extracted: ExtractedJob[],
  company: CompanyDoc,
  pageUrl: string
): NormalizedJob[] {
  const source = companySource(company.name);
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const ej of extracted) {
    const title = (ej.title ?? "").trim();
    if (!title) continue;
    const cat = categorizeTitle(title);
    if (!cat.matched) continue;
    const apply = (ej.apply_url && absUrl(ej.apply_url, pageUrl)) || pageUrl;
    const k = `${title.toLowerCase()}|${apply}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      title,
      company: company.name,
      location: ej.location?.trim() || null,
      employmentType: ej.employment_type?.trim() || null,
      category: cat.category,
      description: (ej.description ?? "").trim().slice(0, 2000),
      applyUrl: apply,
      postedAt: null,
      deadline: null,
      source,
      sourceUrl: apply,
      sourceType: "private",
      rawTags: company.techStack ?? [],
    });
  }
  return out;
}

async function scrapeOneCompany(
  company: WithId<CompanyDoc>,
  llmClient: Anthropic | null
): Promise<ScrapeOutcome> {
  const source = companySource(company.name);
  const outcome: ScrapeOutcome = { source, jobs: [], errors: [] };

  if (!company.website) {
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "skipped",
      lastCrawlError: "no website",
    });
    return outcome;
  }

  let careersUrl = company.careersUrl;
  let homepageHtml = "";

  if (!careersUrl) {
    try {
      homepageHtml = await fetchText(company.website, { timeoutMs: 18_000 });
    } catch (e) {
      const msg = (e as Error).message;
      outcome.errors.push(`homepage fetch: ${msg}`);
      await updateCompanyCrawlState(company.name, {
        lastCrawlStatus: "fetch-failed",
        lastCrawlError: msg.slice(0, 500),
      });
      return outcome;
    }
    const truncated = homepageHtml.length > MAX_PAGE_BYTES ? homepageHtml.slice(0, MAX_PAGE_BYTES) : homepageHtml;
    const atsOnHome = detectAts(truncated);
    if (atsOnHome) {
      try {
        outcome.jobs = await fetchAtsJobs(atsOnHome, company);
        await updateCompanyCrawlState(company.name, {
          lastCrawlStatus: "ok",
          lastCrawlError: null,
          careersUrl:
            atsOnHome.vendor === "greenhouse"
              ? `https://boards.greenhouse.io/${atsOnHome.slug}`
              : atsOnHome.vendor === "lever"
              ? `https://jobs.lever.co/${atsOnHome.slug}`
              : `https://apply.workable.com/${atsOnHome.slug}/`,
        });
        return outcome;
      } catch (e) {
        outcome.errors.push(`ats(${atsOnHome.vendor}): ${(e as Error).message}`);
      }
    }
    careersUrl = findCareersUrl(truncated, company.website);
    if (!careersUrl) {
      await updateCompanyCrawlState(company.name, {
        lastCrawlStatus: "no-careers-page",
        lastCrawlError: null,
      });
      return outcome;
    }
  }

  let careersHtml = "";
  try {
    careersHtml = await fetchText(careersUrl, { timeoutMs: 22_000 });
  } catch (e) {
    const msg = (e as Error).message;
    outcome.errors.push(`careers fetch ${careersUrl}: ${msg}`);
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "fetch-failed",
      lastCrawlError: msg.slice(0, 500),
      careersUrl,
    });
    return outcome;
  }

  const trimmed = careersHtml.length > MAX_PAGE_BYTES ? careersHtml.slice(0, MAX_PAGE_BYTES) : careersHtml;

  const ats = detectAts(trimmed);
  if (ats) {
    try {
      const atsJobs = await fetchAtsJobs(ats, company);
      if (atsJobs.length > 0) {
        outcome.jobs = atsJobs;
        await updateCompanyCrawlState(company.name, {
          lastCrawlStatus: "ok",
          lastCrawlError: null,
          careersUrl,
        });
        return outcome;
      }
    } catch (e) {
      outcome.errors.push(`ats(${ats.vendor}): ${(e as Error).message}`);
    }
  }

  const jsonLd = extractJsonLdJobs(trimmed, careersUrl, company);
  if (jsonLd.length > 0) {
    outcome.jobs = jsonLd;
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "ok",
      lastCrawlError: null,
      careersUrl,
    });
    return outcome;
  }

  if (!llmClient) {
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "no-careers-page",
      lastCrawlError: "no ATS / JSON-LD; LLM crawler disabled",
      careersUrl,
    });
    return outcome;
  }

  const pageText = htmlToText(trimmed);
  if (pageText.length < 80) {
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "no-careers-page",
      lastCrawlError: "page text too short",
      careersUrl,
    });
    return outcome;
  }

  let extracted: ExtractedJob[] = [];
  try {
    extracted = await extractJobsWithLLM(llmClient, company.name, pageText, careersUrl);
  } catch (e) {
    const msg = (e as Error).message;
    outcome.errors.push(`llm: ${msg}`);
    await updateCompanyCrawlState(company.name, {
      lastCrawlStatus: "extract-failed",
      lastCrawlError: msg.slice(0, 500),
      careersUrl,
    });
    return outcome;
  }

  outcome.jobs = llmJobsToNormalized(extracted, company, careersUrl);
  await updateCompanyCrawlState(company.name, {
    lastCrawlStatus: "ok",
    lastCrawlError: null,
    careersUrl,
  });
  return outcome;
}

export async function scrapeCompanyBatch(
  companies: WithId<CompanyDoc>[]
): Promise<ScrapeOutcome[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const llmClient = apiKey ? new Anthropic({ apiKey }) : null;

  const results: ScrapeOutcome[] = [];
  for (const c of companies) {
    results.push(await scrapeOneCompany(c, llmClient));
    await jitter(500, 1200);
  }
  return results;
}
