const USER_AGENT =
  "khoj-jobs-bot/0.1 (+https://github.com/strativ-dev; aggregator for Bangladesh IT job listings)";

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function fetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const { timeoutMs = 20_000, headers = {} } = opts;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,bn;q=0.7",
        ...headers,
      },
      redirect: "follow",
      signal: ac.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function jitter(minMs: number, maxMs: number): Promise<void> {
  const span = Math.max(0, maxMs - minMs);
  await sleep(minMs + Math.floor(Math.random() * span));
}
