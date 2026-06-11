import * as cheerio from "cheerio";
import { fetchText, jitter } from "./http";
import { categorizeTitle } from "./filter-it";
import type { NormalizedJob, ScrapeOutcome } from "./types";

interface MinistrySource {
  key: string;
  name: string;
  url: string;
  linkSelector: string;
  base: string;
}

const MINISTRY_SOURCES: MinistrySource[] = [
  {
    key: "bpsc",
    name: "Bangladesh Public Service Commission",
    url: "https://bpsc.gov.bd/site/view/notices",
    linkSelector: "a[href*='/pages/notices/'], a[href*='/site/notices/']",
    base: "https://bpsc.gov.bd",
  },
  {
    key: "mopa",
    name: "Ministry of Public Administration",
    url: "https://mopa.gov.bd/site/view/notices",
    linkSelector: "a[href*='/pages/notices/']",
    base: "https://mopa.gov.bd",
  },
  {
    key: "ntrca",
    name: "Non-Government Teachers Registration and Certification Authority",
    url: "https://ntrca.gov.bd/site/view/notices",
    linkSelector: "a[href*='/pages/notices/']",
    base: "https://ntrca.gov.bd",
  },
  {
    key: "bangladesh-bank",
    name: "Bangladesh Bank",
    url: "https://www.bb.org.bd/aboutus/career.php",
    linkSelector: "a[href$='.pdf'], a[href*='career']",
    base: "https://www.bb.org.bd",
  },
  {
    key: "banbeis",
    name: "Bangladesh Bureau of Educational Information and Statistics",
    url: "https://banbeis.gov.bd/site/view/notices",
    linkSelector: "a[href*='/pages/notices/']",
    base: "https://banbeis.gov.bd",
  },
  {
    key: "ictd",
    name: "Information and Communication Technology Division",
    url: "https://ictd.gov.bd/site/view/notices",
    linkSelector: "a[href*='/pages/notices/']",
    base: "https://ictd.gov.bd",
  },
];

function abs(href: string, base: string): string {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `${base}${href}`;
  return `${base}/${href}`;
}

const TRAILING_ID_RX = /-[a-z0-9]{6,8}(?:-[a-f0-9]{16,32})?$/i;

function titleFromBgdPortalSlug(href: string): string {
  try {
    const url = new URL(href, "https://example.com");
    const parts = url.pathname.split("/").filter(Boolean);
    const slugRaw = parts[parts.length - 1] ?? "";
    const decoded = decodeURIComponent(slugRaw);
    const stripped = decoded.replace(TRAILING_ID_RX, "");
    return stripped.replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

function titleFromParts(text: string, titleAttr: string | undefined, href: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t && t.length >= 6) return t;
  const ta = titleAttr?.trim();
  if (ta && ta.length >= 6) return ta;
  if (/\/pages\/notices\//.test(href)) {
    const fromSlug = titleFromBgdPortalSlug(href);
    if (fromSlug.length >= 6) return fromSlug;
  }
  return "";
}

async function scrapeOneMinistry(src: MinistrySource): Promise<ScrapeOutcome> {
  const outcome: ScrapeOutcome = { source: `ministry:${src.key}`, jobs: [], errors: [] };
  let html = "";
  try {
    html = await fetchText(src.url, { timeoutMs: 20_000 });
  } catch (e) {
    outcome.errors.push(`fetch ${src.url}: ${(e as Error).message}`);
    return outcome;
  }

  try {
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    $(src.linkSelector).each((_, el) => {
      const $a = $(el);
      const href = $a.attr("href")?.trim() ?? "";
      if (!href) return;
      const applyUrl = abs(href, src.base);
      if (!/^https?:\/\//i.test(applyUrl)) return;
      if (seen.has(applyUrl)) return;
      seen.add(applyUrl);

      const title = titleFromParts($a.text(), $a.attr("title"), applyUrl);
      if (!title) return;

      const cat = categorizeTitle(title);
      if (!cat.matched) return;

      const descSrc =
        $a.closest("tr, li, .row, .card, .notice-row, .single-notice").text() || $a.text();

      const job: NormalizedJob = {
        title: title.slice(0, 280),
        company: src.name,
        location: "Bangladesh",
        employmentType: "Government",
        category: cat.category,
        description: descSrc.replace(/\s+/g, " ").trim().slice(0, 2000),
        applyUrl,
        postedAt: null,
        deadline: null,
        source: `ministry:${src.key}`,
        sourceUrl: applyUrl,
        sourceType: "gov",
        rawTags: [],
      };
      outcome.jobs.push(job);
    });
  } catch (e) {
    outcome.errors.push(`parse: ${(e as Error).message}`);
  }
  return outcome;
}

export async function scrapeMinistrySites(): Promise<ScrapeOutcome[]> {
  const results: ScrapeOutcome[] = [];
  for (const src of MINISTRY_SOURCES) {
    results.push(await scrapeOneMinistry(src));
    await jitter(600, 1500);
  }
  return results;
}
