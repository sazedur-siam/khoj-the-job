import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { persistOutcome } from "@/lib/run-scrapers";
import { scrapeInternational } from "@/lib/scrapers/remote-intl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const outcomes = await scrapeInternational();
  const summaries = [];
  for (const o of outcomes) {
    summaries.push(await persistOutcome(o, startedAt));
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    durationMs: Date.now() - startedAt.getTime(),
    summaries,
  });
}
