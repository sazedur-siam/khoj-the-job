import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const baseParams = Object.fromEntries(
    Object.entries(searchParams).filter(([k, v]) => k !== "page" && v != null && v !== "")
  ) as Record<string, string>;

  function href(p: number): string {
    const sp = new URLSearchParams(baseParams);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  }

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const showNumbers = totalPages > 3;
  const numbers = showNumbers ? buildPages(page, totalPages) : [];

  const baseBtn =
    "inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--foreground-muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]";
  const disabled =
    "inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-medium text-[var(--foreground-subtle)] opacity-50";
  const numBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 font-mono text-xs text-[var(--foreground-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]";
  const numActive =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-2 font-mono text-xs text-[var(--accent-foreground)]";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row"
    >
      {page > 1 ? (
        <Link href={href(prev)} className={baseBtn} aria-label="Previous page">
          <span aria-hidden className="mr-1">←</span> Previous
        </Link>
      ) : (
        <span className={disabled} aria-disabled>
          <span aria-hidden className="mr-1">←</span> Previous
        </span>
      )}

      <div className="flex items-center gap-3">
        {showNumbers && (
          <ul className="hidden items-center gap-1 sm:flex">
            {numbers.map((n, i) =>
              n === "…" ? (
                <li
                  key={`gap-${i}`}
                  className="px-1 font-mono text-xs text-[var(--foreground-subtle)]"
                  aria-hidden
                >
                  ·
                </li>
              ) : (
                <li key={n}>
                  {n === page ? (
                    <span className={numActive} aria-current="page">
                      {n}
                    </span>
                  ) : (
                    <Link href={href(n)} className={numBtn}>
                      {n}
                    </Link>
                  )}
                </li>
              )
            )}
          </ul>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
          Page {page} of {totalPages} · {total.toLocaleString()} results
        </span>
      </div>

      {page < totalPages ? (
        <Link href={href(next)} className={baseBtn} aria-label="Next page">
          Next <span aria-hidden className="ml-1">→</span>
        </Link>
      ) : (
        <span className={disabled} aria-disabled>
          Next <span aria-hidden className="ml-1">→</span>
        </span>
      )}
    </nav>
  );
}

function buildPages(current: number, total: number): Array<number | "…"> {
  const out: Array<number | "…"> = [];
  const from = Math.max(2, current - 2);
  const to = Math.min(total - 1, current + 2);
  out.push(1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("…");
  if (total > 1) out.push(total);
  return out;
}
