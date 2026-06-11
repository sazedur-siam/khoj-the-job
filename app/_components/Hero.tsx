import { getJobStats, type JobStats } from "@/lib/db/jobs";

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export async function Hero({ stats }: { stats?: JobStats }) {
  const data = stats ?? (await getJobStats());

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
      <DotPattern />
      <div className="relative mx-auto max-w-6xl px-5 py-6 sm:py-8">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Government jobs"
            value={data.gov}
            color="var(--gov)"
            soft="var(--gov-soft)"
          />
          <StatTile
            label="Private jobs"
            value={data.private}
            color="var(--private)"
            soft="var(--private-soft)"
          />
          <StatTile
            label="International / Remote"
            value={data.international}
            color="var(--intl)"
            soft="var(--intl-soft)"
          />
          <StatTile
            label="Companies tracked"
            value={data.companies}
            color="var(--foreground)"
            soft="var(--surface-2)"
            neutral
          />
        </dl>

        <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
          <span>{formatCount(data.total)} total listings indexed</span>
          <span aria-hidden>·</span>
          <span>Auto-refresh 24h</span>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  color,
  soft,
  neutral = false,
}: {
  label: string;
  value: number;
  color: string;
  soft: string;
  neutral?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)]"
    >
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: neutral ? "var(--border-strong)" : color }}
        aria-hidden
      />
      <div className="pl-2">
        <div
          className="flex items-baseline gap-2 leading-none tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="text-4xl sm:text-5xl" style={{ color: neutral ? "var(--foreground)" : color }}>
            {formatCount(value)}
          </span>
        </div>
        <dt className="mt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
          {label}
        </dt>
      </div>
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-60 blur-2xl"
        style={{ background: soft }}
        aria-hidden
      />
    </div>
  );
}

function DotPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      style={{
        backgroundImage:
          "radial-gradient(var(--border-strong) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}
