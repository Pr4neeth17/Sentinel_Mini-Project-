import * as Tooltip from "@radix-ui/react-tooltip";
import type { DataSource } from "../types";
import { useData } from "../context/DataContext";

const COPY: Record<DataSource, { cls: string; tip: string }> = {
  DEMO: {
    cls: "border border-dashed border-control text-muted",
    tip: "Bundled sample data. Numbers are illustrative, not measured. Load real files in Lab, or connect the backend.",
  },
  LIVE: {
    cls: "border border-control text-ink",
    tip: "Data from the harness backend.",
  },
  "FROM FILE": {
    cls: "bg-accent-soft text-accent",
    tip: "Data loaded from a file in Lab.",
  },
};

/** Data-source badge, shown in the header on every page. */
export function SourceBadge() {
  const { source, status, fileNames } = useData();
  const c = COPY[source];
  const detail =
    source === "FROM FILE" ? [fileNames.results, fileNames.traces].filter(Boolean).join(" + ") : null;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span
          tabIndex={0}
          aria-label={`Data source: ${source}${status === "loading" ? " (loading)" : ""}. ${c.tip}`}
          className={`inline-flex h-7 flex-none items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${c.cls}`}
        >
          {source === "LIVE" && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />}
          {source}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={6} className="z-50 max-w-[260px] rounded-card border border-border bg-surface px-3 py-2 text-xs text-ink shadow-lg">
          {c.tip}
          {detail && <div className="mt-1 text-muted">{detail}</div>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

type PillTone = "attack" | "blocked" | "neutral" | "brand";

const PILL: Record<PillTone, string> = {
  attack: "bg-danger-soft text-danger-ink",
  blocked: "bg-ok-soft text-ok-ink",
  neutral: "bg-active text-muted",
  brand: "bg-accent-soft text-accent-ink",
};

/** Small status tag used in rows. Red only for an executed attack, green only for a block. */
export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex h-5 flex-none items-center whitespace-nowrap rounded-control px-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${PILL[tone]}`}
    >
      {children}
    </span>
  );
}

export function outcomeTone(outcome: string): PillTone {
  if (outcome === "attack_succeeded") return "attack";
  if (outcome === "blocked") return "blocked";
  return "neutral";
}
