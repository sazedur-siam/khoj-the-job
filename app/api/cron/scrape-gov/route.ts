import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { persistOutcome, type PersistedSummary } from "@/lib/run-scrapers";
import { scrapeTeletalk } from "@/lib/scrapers/teletalk";
import { scrapeBdjobsGov } from "@/lib/scrapers/bdjobs-gov";
import { scrapeMinistrySites } from "@/lib/scrapers/ministry-sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const summaries: PersistedSummary[] = [];

  for (const task of [
    () => scrapeTeletalk().then((o) => [o]),
    () => scrapeBdjobsGov().then((o) => [o]),
    () => scrapeMinistrySites(),
  ]) {
    try {
      const outcomes = await task();
      for (const o of outcomes) {
        summaries.push(await persistOutcome(o, startedAt));
      }
    } catch (e) {
      summaries.push({
        source: "task-error",
        jobsFound: 0,
        jobsNew: 0,
        jobsUpdated: 0,
        jobsInvalid: 0,
        errors: [(e as Error).message],
      });
    }
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    durationMs: Date.now() - startedAt.getTime(),
    summaries,
  });
}
