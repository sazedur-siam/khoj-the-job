# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build (also the fastest full typecheck of routes)
npm run lint     # eslint (next/core-web-vitals + next/typescript, flat config)
npm run seed     # tsx scripts/seed-companies.ts — reads data/companies.csv into the companies collection
npx tsc --noEmit # typecheck only
```

There are no tests. Required env in `.env.local`: `MONGODB_URI`, `MONGODB_DB` (defaults to `khoj`), `ANTHROPIC_API_KEY` (company-careers crawler), `CRON_SECRET` (auth for `/api/cron/*`).

Trigger a scraper locally:

```bash
curl -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron/scrape-gov"
curl -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron/scrape-companies?batch=0"
```

## What this is

Khoj (খোঁজ) — a public portal aggregating IT/software jobs in Bangladesh. Next.js 16 App Router + MongoDB Atlas, deployed on Vercel. Data is written exclusively by scrapers running on Vercel Cron (`vercel.json` defines the schedules; company crawling is split into batches of 15 because of the 60s function limit).

## Architecture

Two independent halves share `lib/db/`:

1. **Ingest (write path)**: `app/api/cron/*` routes (guarded by `lib/cron-auth.ts`) call scrapers in `lib/scrapers/` which return a `ScrapeOutcome` (`{ source, jobs: NormalizedJob[], errors }`). `lib/run-scrapers.ts#persistOutcome` validates each job against `NormalizedJobSchema` (zod), upserts by `hash` (sha1 of source + sourceUrl, see `lib/db/hash.ts`), and records a `scrape_runs` audit doc. The company crawler (`lib/scrapers/company-careers.ts`) discovers careers pages and uses Claude Haiku to extract postings; `lib/scrapers/filter-it.ts` decides whether a title is an IT job (English + Bengali regexes) and assigns the category.

2. **Read path (UI + JSON API)**: pages call `lib/db/jobs.ts` directly; `/api/jobs` exposes the same search publicly. `lib/db/mongo.ts` caches the client promise on `globalThis` and ensures indexes once per process — always go through `getDb()`.

### Listing-page data flow (deliberate design)

The homepage (`app/page.tsx`) fetches up to 500 jobs in one query via `searchJobCards()` and paginates **client-side** in `JobsList` (instant page flips, no server round-trip). Two rules keep this cheap:

- `searchJobCards` applies `CARD_PROJECTION` so heavy fields (`description`, `rawTags`, …) never leave Mongo. Use it for any listing; `searchJobs` (full docs) is for the JSON API and detail views.
- Only `JobCardData` (plain strings, ISO dates — produced by `serializeJobCards`) crosses the server→client component boundary. Client components must not import runtime values from `lib/db/*` (mongodb is server-only); `import type` is fine.

`schemas.ts` is the single source of truth for the job shape: `NormalizedJob` (zod, what scrapers emit) → `JobDoc` (+ hash/scrapedAt/updatedAt, what Mongo stores) → `JobCardDoc`/`JobCardData` (projected/serialized views in `lib/db/jobs.ts`).

### UI conventions

- **Theming**: all colors are CSS variables in `app/globals.css` with `.dark` overrides, mapped through `@theme inline` so canonical Tailwind utilities exist — write `bg-surface`, `text-foreground-subtle`, `border-border`, not `bg-[var(--surface)]`. Opacity-modified vars use the v4 shorthand: `bg-(--surface-2)/60`. Dark mode is a `.dark` class on `<html>`, set pre-paint by the inline `THEME_INIT` script in `layout.tsx` and managed by `ThemeToggle` (localStorage key `khoj-theme`, `useSyncExternalStore`).
- **Nav feedback**: filter/pagination transitions broadcast a `khoj:nav-progress` CustomEvent via `emitNavProgress` (called from `useTransition` pending state); `useNavPending()` in `NavProgress.tsx` is the shared subscriber (top progress bar, `ResultsFade` dimming).
- **Shared presentation helpers** live in `lib/format.ts`: `formatDate`, `relativeDate`, `initials`, `bnClass`/`isBengali` (Bengali text gets `--font-bengali`), and `TYPE_META` (per-sourceType label + accent colors). Don't re-implement these in components.
- Job titles/companies can be Bengali — wrap user-visible job text with `bnClass(...)`.

### Gotchas

- `searchJobs` text search (`$text`) depends on the `jobs_text` index created in `mongo.ts#ensureIndexes`; index changes require dropping the old index in Atlas manually.
- `vercel.json` cron paths include the `?batch=N` query — adding companies beyond batch 8 × 15 requires new cron entries.
- `app/jobs/[id]/page.tsx` is reachable but not linked from cards (cards link straight to `applyUrl`); it wraps `getJobById` in React `cache()` because `generateMetadata` and the page both call it.
