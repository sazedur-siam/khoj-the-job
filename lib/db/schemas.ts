import { z } from "zod";

export const SourceType = z.enum(["gov", "private", "international"]);
export type SourceType = z.infer<typeof SourceType>;

export const JobCategory = z.enum([
  "software-engineering",
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "qa",
  "data",
  "ai-ml",
  "other-it",
]);
export type JobCategory = z.infer<typeof JobCategory>;

export const NormalizedJobSchema = z.object({
  title: z.string().min(2).max(300),
  company: z.string().min(1).max(200),
  location: z.string().max(200).nullable().optional(),
  employmentType: z.string().max(100).nullable().optional(),
  category: JobCategory,
  description: z.string().max(60_000).default(""),
  applyUrl: z.string().url().max(2048),
  postedAt: z.date().nullable().optional(),
  deadline: z.date().nullable().optional(),
  source: z.string().min(1).max(120),
  sourceUrl: z.string().url().max(2048),
  sourceType: SourceType,
  rawTags: z.array(z.string().max(80)).max(40).default([]),
});
export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;

export interface JobDoc extends NormalizedJob {
  hash: string;
  scrapedAt: Date;
  updatedAt: Date;
}

export interface CompanyDoc {
  name: string;
  website: string | null;
  linkedin: string | null;
  techStack: string[];
  careersUrl: string | null;
  lastCrawledAt: Date | null;
  lastCrawlStatus: "ok" | "no-careers-page" | "fetch-failed" | "extract-failed" | "skipped" | null;
  lastCrawlError: string | null;
}

export interface ScrapeRunDoc {
  source: string;
  startedAt: Date;
  finishedAt: Date | null;
  jobsFound: number;
  jobsNew: number;
  jobsUpdated: number;
  errors: string[];
}
