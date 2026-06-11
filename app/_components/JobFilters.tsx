"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { emitNavProgress } from "./NavProgress";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Government", value: "gov" },
  { label: "Private", value: "private" },
  { label: "Int'l / Remote", value: "international" },
] as const;

const DATE_FILTERS = [
  { label: "Any time", value: "" },
  { label: "Last 24h", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
] as const;

const CATEGORY_FILTERS = [
  { label: "Any role", value: "" },
  { label: "Software Eng", value: "software-engineering" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Fullstack", value: "fullstack" },
  { label: "Mobile", value: "mobile" },
  { label: "DevOps", value: "devops" },
  { label: "QA", value: "qa" },
  { label: "Data", value: "data" },
  { label: "AI / ML", value: "ai-ml" },
  { label: "Other IT", value: "other-it" },
] as const;

export function JobFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const currentType = sp.get("type") ?? "";
  const currentCategory = sp.get("category") ?? "";
  const currentWithin = sp.get("within") ?? "";

  useEffect(() => {
    emitNavProgress(isPending);
  }, [isPending]);

  function navigate(next: URLSearchParams) {
    next.delete("page");
    startTransition(() => {
      router.push(`/?${next.toString()}`);
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    navigate(next);
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(next);
  }

  const hasActiveFilters = !!(currentType || currentCategory || currentWithin || sp.get("q"));

  function clearAll() {
    setQ("");
    startTransition(() => router.push("/"));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit}>
        <label className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-sm focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-[var(--foreground-subtle)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs"
            className="w-full bg-transparent text-sm placeholder:text-[var(--foreground-subtle)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[var(--foreground)] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--background)] hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "…" : "Go"}
          </button>
        </label>
      </form>

      <FilterGroup
        label="Source"
        items={TYPE_FILTERS}
        current={currentType}
        onSelect={(v) => setParam("type", v)}
      />
      <FilterGroup
        label="Posted"
        items={DATE_FILTERS}
        current={currentWithin}
        onSelect={(v) => setParam("within", v)}
      />
      <FilterGroup
        label="Role"
        items={CATEGORY_FILTERS}
        current={currentCategory}
        onSelect={(v) => setParam("category", v)}
      />

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
        >
          Clear all filters →
        </button>
      )}
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  items: readonly { readonly label: string; readonly value: string }[];
  current: string;
  onSelect: (value: string) => void;
}

function FilterGroup({ label, items, current, onSelect }: FilterGroupProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((f) => {
          const active = current === f.value;
          return (
            <button
              key={f.label}
              onClick={() => onSelect(f.value)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
