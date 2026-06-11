import { getJobStats, type JobStats } from "@/lib/db/jobs";

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export async function Hero({ stats }: { stats?: JobStats }) {
  const data = stats ?? (await getJobStats());

  return (
    <section className="sticky top-[57px] z-20 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5">
        <StatPill label="Government" value={data.gov} dot="var(--gov)" />
        <Divider />
        <StatPill label="Private" value={data.private} dot="var(--private)" />
        <Divider />
        <StatPill label="International" value={data.international} dot="var(--intl)" />
        <Divider />
        <StatPill label="Companies" value={data.companies} dot="var(--foreground-subtle)" />
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)] md:inline">
          {formatCount(data.total)} indexed · refresh 24h
        </span>
      </div>
    </section>
  );
}

function StatPill({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: dot }}
      />
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
        {formatCount(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-3 w-px bg-[var(--border-strong)] sm:inline-block" />;
}
