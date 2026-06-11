# Khoj — IT Jobs in Bangladesh

Public portal that aggregates IT / Software Engineering / Programmer job listings in Bangladesh from:

- **Government sources**: `alljobs.teletalk.com.bd`, BDJobs government category, and ministry sites (BPSC, MoPA, NTRCA, Bangladesh Bank).
- **Private companies**: ~129 Bangladesh software firms (from `data/companies.csv`), via a generic careers-page crawler with Claude Haiku extraction.

Built with Next.js 16 (App Router) + MongoDB Atlas + Vercel Cron.

## Setup

1. **Install deps**

   ```bash
   pnpm install
   ```

2. **Create `.env.local`** (copy from `.env.example`)

   ```
   MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=khoj
   ANTHROPIC_API_KEY=sk-ant-...
   CRON_SECRET=change-me-to-a-long-random-string
   ```

   - `MONGODB_URI` — your MongoDB Atlas connection string.
   - `ANTHROPIC_API_KEY` — used by the generic careers-page crawler.
   - `CRON_SECRET` — required header for hitting `/api/cron/*` routes.

3. **Seed company list**

   ```bash
   pnpm seed
   ```

   Reads `data/companies.csv` and upserts each row into the `companies` collection.

4. **Run dev server**

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>.

## Running scrapers locally

```bash
# Government circulars + BDJobs gov + ministry sites
curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/scrape-gov

# One batch (15 companies) of the private career-page crawler
curl -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron/scrape-companies?batch=0"
```

## Production cron schedule

See `vercel.json`. Daily schedule:

- `02:00 UTC` — government scrape.
- `03:00 – 11:00 UTC` — company-careers crawler, one 15-company batch per hour (covers ~135 companies in 9 hours).

Vercel automatically sends `Authorization: Bearer $CRON_SECRET` to these routes.

## Project structure

```
app/
  page.tsx                   # job listings (server component)
  jobs/[id]/page.tsx         # job detail
  _components/               # JobFilters (client), JobCard, Pagination
  api/
    jobs/route.ts            # GET /api/jobs?q=&type=&category=&page=
    jobs/[id]/route.ts       # GET /api/jobs/:id
    cron/
      scrape-gov/route.ts
      scrape-companies/route.ts
lib/
  db/                        # mongo, schemas, jobs, companies, scrape-runs
  scrapers/                  # teletalk, bdjobs-gov, ministry-sites, company-careers
  cron-auth.ts
  run-scrapers.ts            # outcome → DB persistence
scripts/
  seed-companies.ts          # tsx scripts/seed-companies.ts
data/
  companies.csv              # snapshot of the source Google Sheet
vercel.json                  # cron schedule
```

## MongoDB collections

- `jobs` — `{ hash (unique), title, company, location, employmentType, category, description, applyUrl, postedAt, deadline, source, sourceUrl, sourceType, rawTags, scrapedAt, updatedAt }`
- `companies` — `{ name (unique), website, linkedin, techStack, careersUrl, lastCrawledAt, lastCrawlStatus, lastCrawlError }`
- `scrape_runs` — `{ source, startedAt, finishedAt, jobsFound, jobsNew, jobsUpdated, errors }`

Indexes (auto-created on first DB use): `jobs.hash` unique, `jobs.postedAt` desc, `jobs.{sourceType, category}`, text index on `jobs.{title, company, description}`.

## Filtering

Every scraper applies `lib/scrapers/filter-it.ts` before storage, so only IT / Software / Programmer roles are persisted. Categories (`frontend`, `backend`, `devops`, `data`, `ai-ml`, …) are derived from the title.

## Known limits

- Vercel Hobby plan caps API routes at 60s. Company batches are sized at 15 to fit. Upgrade to Pro for larger batches or fewer cron entries.
- BDJobs has anti-bot measures; if it starts returning blocks, narrow the user-agent or move that scraper to a separate worker.
- The generic crawler depends on companies having a discoverable `/careers` style page. Companies with no public listings page get logged with `lastCrawlStatus = 'no-careers-page'`.
