import { getJobStats, type JobStats } from "@/lib/db/jobs";

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export async function Hero({ stats }: { stats?: JobStats }) {
  const data = stats ?? (await getJobStats());

  return (
    <section className="sticky top-[57px] z-20 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 sm:gap-x-5 sm:px-5 sm:py-2.5">
        <StatPill label="Gov" longLabel="Government" value={data.gov} dot="var(--gov)" />
        <Divider />
        <StatPill label="Priv" longLabel="Private" value={data.private} dot="var(--private)" />
        <Divider />
        <StatPill label="Intl" longLabel="International" value={data.international} dot="var(--intl)" />
        <Divider />
        <StatPill
          label="Cos"
          longLabel="Companies"
          value={data.companies}
          dot="var(--foreground-subtle)"
        />
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)] md:inline">
          {formatCount(data.total)} indexed · refresh 24h
        </span>
      </div>
    </section>
  );
}

function StatPill({
  label,
  longLabel,
  value,
  dot,
}: {
  label: string;
  longLabel: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: dot }}
      />
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground-muted)] sm:text-[11px] sm:tracking-[0.18em]">
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{longLabel}</span>
      </span>
      <span className="font-mono text-xs font-semibold text-[var(--foreground)] sm:text-sm">
        {formatCount(value)}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span aria-hidden className="hidden h-3 w-px bg-[var(--border-strong)] md:inline-block" />
  );
}
