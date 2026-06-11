import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { upsertCompany, totalCompanyCount } from "../lib/db/companies";

interface CsvRow {
  "#": string;
  "Company Name": string;
  Website: string;
  "LinkedIn Profile": string;
  "JS Technologies Used": string;
}

function clean(s: string | undefined): string {
  return (s ?? "").trim();
}

function normalizeWebsite(raw: string): string | null {
  const v = clean(raw);
  if (!v || v === "-" || v === "—") return null;
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function normalizeLinkedin(raw: string): string | null {
  const v = clean(raw);
  if (!v || v === "-" || v === "—") return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.linkedin.com/company/${v}`;
}

function splitTech(raw: string): string[] {
  return clean(raw)
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const csvPath = resolve(process.cwd(), "data/companies.csv");
  const text = readFileSync(csvPath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];

  let upserted = 0;
  for (const row of rows) {
    const name = clean(row["Company Name"]);
    if (!name) continue;
    await upsertCompany({
      name,
      website: normalizeWebsite(row.Website),
      linkedin: normalizeLinkedin(row["LinkedIn Profile"]),
      techStack: splitTech(row["JS Technologies Used"]),
    });
    upserted++;
  }

  const total = await totalCompanyCount();
  console.log(`Upserted ${upserted} companies. Collection now has ${total} docs.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
