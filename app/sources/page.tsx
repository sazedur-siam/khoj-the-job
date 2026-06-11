import Link from "next/link";
import { listAllCompanies } from "@/lib/db/companies";
import {
  GOVERNMENT_SOURCES,
  INTERNATIONAL_SOURCES,
  PRIVATE_CRAWL_PATH,
} from "@/lib/sources-catalog";

export const revalidate = 300;

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: "OK", color: "var(--gov)", bg: "var(--gov-soft)" },
  active: { label: "Active", color: "var(--gov)", bg: "var(--gov-soft)" },
  "no-careers-page": {
    label: "No careers page",
    color: "var(--foreground-subtle)",
    bg: "var(--surface-2)",
  },
  "fetch-failed": { label: "Fetch failed", color: "var(--danger)", bg: "var(--surface-2)" },
  "extract-failed": { label: "Extract failed", color: "var(--danger)", bg: "var(--surface-2)" },
  skipped: { label: "Skipped", color: "var(--foreground-subtle)", bg: "var(--surface-2)" },
  "stubbed-spa": { label: "SPA · stubbed", color: "var(--private)", bg: "var(--private-soft)" },
  "config-only": { label: "Config only", color: "var(--foreground-subtle)", bg: "var(--surface-2)" },
  "never-crawled": {
    label: "Never crawled",
    color: "var(--foreground-subtle)",
    bg: "var(--surface-2)",
  },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    label: status,
    color: "var(--foreground-subtle)",
    bg: "var(--surface-2)",
  };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em]"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function shorten(url: string): string {
  try {
    const u = new URL(url);
    const path =
      u.pathname === "/" ? "" : u.pathname.length > 34 ? u.pathname.slice(0, 32) + "…" : u.pathname;
    return `${u.host}${path}`;
  } catch {
    return url;
  }
}

function ExtLink({ url, subtle = false }: { url: string; subtle?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`truncate font-mono text-xs hover:underline ${
        subtle ? "text-[var(--foreground-subtle)]" : "text-[var(--accent)]"
      }`}
      title={url}
    >
      {shorten(url)}
    </a>
  );
}

type Tab = "endpoints" | "companies";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tabRaw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: Tab = tabRaw === "companies" ? "companies" : "endpoints";

  const companies = await listAllCompanies();
  const withCareers = companies.filter((c) => c.careersUrl);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <div className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
        <span className="inline-block h-px w-6 bg-[var(--border-strong)]" />
        <span>Transparency</span>
      </div>

      <h1 className="font-display mb-3 text-4xl text-[var(--foreground)] sm:text-5xl">
        Where we get the data
      </h1>
      <p className="mb-8 max-w-2xl text-sm text-[var(--foreground-muted)] sm:text-base">
        Government circulars are scraped daily, international boards daily, and private company
        careers pages hourly in batches of 15.
      </p>

      <div className="mb-8 flex gap-1 border-b border-[var(--border)]">
        <TabLink href="/sources" active={tab === "endpoints"}>
          Scrape endpoints
        </TabLink>
        <TabLink href="/sources?tab=companies" active={tab === "companies"}>
          Companies ({companies.length})
        </TabLink>
      </div>

      {tab === "endpoints" ? (
        <EndpointsTab careersUrls={withCareers} />
      ) : (
        <CompaniesTab companies={companies} />
      )}

      <div className="mt-12 border-t border-[var(--border)] pt-6">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] hover:text-[var(--accent)]"
        >
          ← Back to listings
        </Link>
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-[var(--accent)] text-[var(--foreground)]"
          : "border-transparent text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}

type CompanyRow = Awaited<ReturnType<typeof listAllCompanies>>[number];

function EndpointsTab({ careersUrls }: { careersUrls: CompanyRow[] }) {
  return (
    <div className="space-y-12">
      <section>
        <SectionHeading
          title="Government sources"
          meta={`${GOVERNMENT_SOURCES.length} configured`}
        />
        <ul className="space-y-2">
          {GOVERNMENT_SOURCES.map((s) => (
            <li
              key={s.key}
              className="grid grid-cols-1 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <div className="text-sm font-medium text-[var(--foreground)]">{s.name}</div>
              <ExtLink url={s.url} />
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <StatusPill status={s.status} />
                {s.note && (
                  <span className="text-[10px] text-[var(--foreground-subtle)]">{s.note}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading
          title="International / remote boards"
          meta={`${INTERNATIONAL_SOURCES.length} configured`}
        />
        <ul className="space-y-2">
          {INTERNATIONAL_SOURCES.map((s) => (
            <li
              key={s.key}
              className="grid grid-cols-1 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <div className="text-sm font-medium text-[var(--foreground)]">{s.name}</div>
              <ExtLink url={s.url} />
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <StatusPill status={s.status} />
                {s.note && (
                  <span className="text-[10px] text-[var(--foreground-subtle)]">{s.note}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading
          title="Discovered company careers pages"
          meta={`${careersUrls.length} discovered`}
        />
        <details className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
          <summary className="cursor-pointer font-medium text-[var(--foreground)]">
            How the private crawler discovers job postings
          </summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[var(--foreground-muted)]">
            {PRIVATE_CRAWL_PATH.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
        {careersUrls.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-[var(--foreground-subtle)]">
            No careers pages discovered yet — they appear here after the company crawler runs.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {careersUrls.map((c) => (
              <li
                key={c._id.toString()}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--foreground)]">
                    {c.name}
                  </div>
                  {c.careersUrl && <ExtLink url={c.careersUrl} />}
                </div>
                <StatusPill status={c.lastCrawlStatus ?? "never-crawled"} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CompaniesTab({ companies }: { companies: CompanyRow[] }) {
  return (
    <section>
      <SectionHeading title="Tracked companies" meta={`${companies.length} total`} />
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <li
            key={c._id.toString()}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
          >
            <div className="truncate text-sm font-medium text-[var(--foreground)]" title={c.name}>
              {c.name}
            </div>
            {c.website ? (
              <ExtLink url={c.website} />
            ) : (
              <span className="font-mono text-xs text-[var(--foreground-subtle)]">no website</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionHeading({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-4 flex items-end justify-between border-b border-[var(--border)] pb-2">
      <h2 className="font-display text-2xl text-[var(--foreground)]">{title}</h2>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
        {meta}
      </span>
    </div>
  );
}
