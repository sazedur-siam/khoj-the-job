import { NextResponse, type NextRequest } from "next/server";
import { searchJobs } from "@/lib/db/jobs";
import { JobCategory, SourceType } from "@/lib/db/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const typeParam = sp.get("type");
  const categoryParam = sp.get("category");

  try {
    const withinDaysRaw = sp.get("within");
    const withinDays = withinDaysRaw ? parseInt(withinDaysRaw, 10) : undefined;
    const result = await searchJobs({
      q: sp.get("q") || undefined,
      type: typeParam ? SourceType.parse(typeParam) : undefined,
      category: categoryParam ? JobCategory.parse(categoryParam) : undefined,
      withinDays: withinDays && withinDays > 0 ? withinDays : undefined,
      page: parseInt(sp.get("page") || "1", 10),
      pageSize: parseInt(sp.get("pageSize") || "20", 10),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
