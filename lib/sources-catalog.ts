export interface GovernmentSourceEntry {
  key: string;
  name: string;
  url: string;
  status: "active" | "stubbed-spa" | "config-only";
  note?: string;
}

export const GOVERNMENT_SOURCES: GovernmentSourceEntry[] = [
  {
    key: "teletalk",
    name: "Alljobs by Teletalk",
    url: "https://alljobs.teletalk.com.bd/",
    status: "stubbed-spa",
    note: "React SPA — requires Playwright or reverse-engineered JSON API.",
  },
  {
    key: "bdjobs-gov",
    name: "BDJobs · Government category",
    url: "https://bdjobs.com/h/jobs/?fcatId=8",
    status: "stubbed-spa",
    note: "Angular SPA — same limitation as Teletalk.",
  },
  {
    key: "bpsc",
    name: "Bangladesh Public Service Commission",
    url: "https://bpsc.gov.bd/site/view/notices",
    status: "active",
  },
  {
    key: "mopa",
    name: "Ministry of Public Administration",
    url: "https://mopa.gov.bd/site/view/notices",
    status: "active",
  },
  {
    key: "ntrca",
    name: "NTRCA (Teachers' Registration Authority)",
    url: "https://ntrca.gov.bd/site/view/notices",
    status: "active",
    note: "Intermittent — sometimes blocks outbound IP.",
  },
  {
    key: "bangladesh-bank",
    name: "Bangladesh Bank",
    url: "https://www.bb.org.bd/aboutus/career.php",
    status: "active",
  },
  {
    key: "banbeis",
    name: "Bangladesh Bureau of Educational Information and Statistics",
    url: "https://banbeis.gov.bd/site/view/notices",
    status: "active",
  },
  {
    key: "ictd",
    name: "Information and Communication Technology Division",
    url: "https://ictd.gov.bd/site/view/notices",
    status: "active",
  },
];

export const INTERNATIONAL_SOURCES: GovernmentSourceEntry[] = [
  {
    key: "remotive",
    name: "Remotive · Remote software jobs",
    url: "https://remotive.com/api/remote-jobs?category=software-dev",
    status: "active",
    note: "Public JSON API, software-dev category.",
  },
  {
    key: "arbeitnow",
    name: "Arbeitnow · Job board API",
    url: "https://www.arbeitnow.com/api/job-board-api",
    status: "active",
    note: "Public JSON API, filtered to remote IT roles.",
  },
];

export const PRIVATE_CRAWL_PATH = [
  "Fetch company homepage",
  "Detect Greenhouse / Lever / Workable ATS link (public JSON API)",
  "Otherwise discover /careers /jobs link and fetch that page",
  "Detect ATS again on the careers page",
  "Extract JSON-LD JobPosting schema if present",
  "Optional: Claude Haiku LLM extraction (requires ANTHROPIC_API_KEY)",
];
