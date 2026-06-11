"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

export function CollapsibleFilters({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const activeCount = ["type", "category", "within", "q"].reduce(
    (n, k) => n + (sp.get(k) ? 1 : 0),
    0
  );

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] lg:hidden"
      >
        <span className="flex items-center gap-2">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {activeCount}
            </span>
          )}
        </span>
        <span aria-hidden className="text-[var(--foreground-subtle)]">
          {open ? "▴" : "▾"}
        </span>
      </button>
      <div className={open ? "block" : "hidden lg:block"}>{children}</div>
    </>
  );
}
