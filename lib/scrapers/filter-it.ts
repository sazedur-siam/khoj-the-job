import type { JobCategory } from "../db/schemas";

const IT_PATTERNS: Array<{ rx: RegExp; category: JobCategory }> = [
  { rx: /\b(devops|sre|site reliability|kubernetes|terraform|cloud engineer|aws engineer|azure engineer|platform engineer)\b/i, category: "devops" },
  { rx: /\b(machine learning|deep learning|ml engineer|ai engineer|nlp|computer vision)\b/i, category: "ai-ml" },
  { rx: /\b(data engineer|data scientist|analytics engineer|bi engineer|etl)\b/i, category: "data" },
  { rx: /\b(qa|quality assurance|tester|sdet|test engineer|automation engineer)\b/i, category: "qa" },
  { rx: /\b(android|ios|flutter|react native|mobile engineer|mobile developer|mobile app developer)\b/i, category: "mobile" },
  { rx: /\b(frontend|front-end|front end|react developer|next\.js|vue developer|angular developer|ui developer)\b/i, category: "frontend" },
  { rx: /\b(backend|back-end|back end|node\.?js developer|python developer|java developer|\.net developer|go developer|php developer|laravel developer|django developer|rails developer|api developer)\b/i, category: "backend" },
  { rx: /\b(full[\s-]?stack|fullstack)\b/i, category: "fullstack" },
  { rx: /\b(software (engineer|developer|architect|programmer)|programmer|software dev|sw engineer|sw developer)\b/i, category: "software-engineering" },
  { rx: /\b(it (officer|specialist|administrator|admin|support)|system administrator|sysadmin|network engineer|database administrator|dba|security engineer|cyber security)\b/i, category: "other-it" },
];

const FALLBACK_KEYWORDS =
  /\b(software|developer|engineer|programmer|computer science|computer engineering|information technology|coding|web development)\b/i;

const BENGALI_IT_PATTERNS: Array<{ rx: RegExp; category: JobCategory }> = [
  { rx: /(নেটওয়ার্ক|সিস্টেম\s*এডমিন|সিস্টেম\s*অ্যাডমিন)/u, category: "devops" },
  { rx: /(ডেটাবেইজ|ডেটাবেস|ডাটাবেইজ|ডাটাবেস|ডেটা\s*সায়েন্স|ডেটা\s*অ্যানালিস্ট)/u, category: "data" },
  { rx: /(মোবাইল\s*(অ্যাপ|অ্যাপ্লিকেশন)|অ্যান্ড্রয়েড|আইওএস)/u, category: "mobile" },
  { rx: /(ওয়েব\s*ডেভেলপার|ফ্রন্টএন্ড|ফ্রন্ট[\s-]?এন্ড)/u, category: "frontend" },
  { rx: /(ব্যাকএন্ড|ব্যাক[\s-]?এন্ড)/u, category: "backend" },
  { rx: /(প্রোগ্রামার|সহকারী\s*প্রোগ্রামার|সিনিয়র\s*প্রোগ্রামার)/u, category: "software-engineering" },
  { rx: /(সফট\s*ওয়্যার|সফটওয়্যার|সফটওয়ার)/u, category: "software-engineering" },
  { rx: /(সফটওয়্যার\s*ইঞ্জিনিয়ার|সফটওয়্যার\s*ডেভেলপার)/u, category: "software-engineering" },
  { rx: /(কম্পিউটার\s*অপারেটর|কম্পিউটার\s*অফিসার)/u, category: "other-it" },
  { rx: /(আইসিটি|আই\s*সি\s*টি|আইটি|তথ্য\s*ও?\s*যোগাযোগ\s*প্রযুক্তি|তথ্য\s*প্রযুক্তি)/u, category: "other-it" },
  { rx: /(কম্পিউটার|হার্ডওয়্যার|হার্ডওয়ার)/u, category: "other-it" },
];

const BENGALI_FALLBACK = /(ডেভেলপার|ইঞ্জিনিয়ার)/u;

export interface CategorizedTitle {
  matched: boolean;
  category: JobCategory;
}

export function categorizeTitle(title: string): CategorizedTitle {
  for (const p of IT_PATTERNS) {
    if (p.rx.test(title)) return { matched: true, category: p.category };
  }
  for (const p of BENGALI_IT_PATTERNS) {
    if (p.rx.test(title)) return { matched: true, category: p.category };
  }
  if (FALLBACK_KEYWORDS.test(title)) {
    return { matched: true, category: "software-engineering" };
  }
  if (BENGALI_FALLBACK.test(title)) {
    return { matched: true, category: "other-it" };
  }
  return { matched: false, category: "other-it" };
}

export function isItJobTitle(title: string): boolean {
  return categorizeTitle(title).matched;
}
