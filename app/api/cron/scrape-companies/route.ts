import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { persistOutcome } from "@/lib/run-scrapers";
import { scrapeCompanyBatch } from "@/lib/scrapers/company-careers";
import { COMPANY_BATCH_SIZE, listCompanyBatch, totalCompanyCount } from "@/lib/db/companies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const batchParam = req.nextUrl.searchParams.get("batch");
  const batch = Math.max(0, parseInt(batchParam ?? "0", 10) || 0);

  const startedAt = new Date();
  const companies = await listCompanyBatch(batch);
  const total = await totalCompanyCount();

  if (companies.length === 0) {
    return NextResponse.json({ ok: true, batch, total, message: "empty batch" });
  }

  const outcomes = await scrapeCompanyBatch(companies);
  const summaries = [];
  for (const o of outcomes) {
    summaries.push(await persistOutcome(o, startedAt));
  }

  return NextResponse.json({
    ok: true,
    batch,
    batchSize: COMPANY_BATCH_SIZE,
    companiesProcessed: companies.length,
    totalCompanies: total,
    durationMs: Date.now() - startedAt.getTime(),
    summaries,
  });
}
