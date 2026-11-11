import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { aggregate } from "../lib/stats";
import { DEFENSES, LAYERED, type DefenseMeta } from "../lib/defenses";
import { int, pct, pts } from "../lib/format";
import { PageHeader } from "../components/ui";
import { Term } from "../components/Term";
import { Skeleton } from "../components/Skeleton";

export default function Defenses() {
  const { results, traces, status } = useData();
  const summary = useMemo(() => aggregate(results), [results]);
  const base = summary.find((d) => d.defense === "none");
  const loading = status === "loading";

  const sampleTrace = (id: string) =>
    traces.find((t) => t.defense === id && t.outcome === "blocked") ?? traces.find((t) => t.defense === id);

  const row = (d: DefenseMeta) => {
    const s = summary.find((x) => x.defense === d.id);
    const cost = s?.BU && base?.BU ? s.BU.p - base.BU.p : null;
    const trace = sampleTrace(d.id);
    return (
      <article
        key={d.id}
        aria-labelledby={`def-${d.id}`}
        className="grid gap-5 rounded-card border border-border bg-surface p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_220px]"
      >
        <div>
          <span className="fig !border-accent !text-accent">{d.short}</span>
          <h2 id={`def-${d.id}`} className="mt-3 text-[24px] font-normal leading-7 tracking-[-0.02em] text-ink">
            {d.name}
          </h2>
          <p className="mt-3 text-base text-ink">{d.idea}</p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div>
            <h3 className="label">How it works</h3>
            <p className="mt-1 text-ink">{d.how}</p>
          </div>
          <div>
            <h3 className="label">Where it fails</h3>
            <p className="mt-1 text-ink">{d.fails}</p>
          </div>
        </div>

        <dl className="flex flex-col gap-3 rounded-card border border-border bg-raised p-4 text-sm">
          <div>
            <dt className="label">
              <Term k="ASR">Attack success</Term>
            </dt>
            <dd className="num mt-1 text-[28px] font-light leading-8 tracking-[-0.02em] text-ink">
              {loading ? <Skeleton className="h-7 w-20" /> : pct(s?.ASR?.p)}
            </dd>
            {s?.ASR && (
              <dd className="num text-xs text-muted">
                {pct(s.ASR.lo)}–{pct(s.ASR.hi)} · n = {int(s.ASR.n)}
                {base?.ASR && ` · baseline ${pct(base.ASR.p)}`}
              </dd>
            )}
          </div>
          <div>
            <dt className="label">
              Utility cost (<Term k="BU">BU</Term>)
            </dt>
            <dd className="num mt-0.5 text-ink">{loading ? <Skeleton className="h-5 w-24" /> : pts(cost)}</dd>
          </div>
          <dd>
            {trace ? (
              <Link to={`/traces?run=${trace.run_id}`} className="font-mono text-[12px] uppercase tracking-[0.06em] text-accent hover:underline">
                Sample trace <span className="font-mono text-code">{trace.run_id}</span> →
              </Link>
            ) : (
              <span className="text-muted">No trace recorded for {d.short} yet.</span>
            )}
          </dd>
        </dl>
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Defenses"
        sub="Five defenses, each a different idea of where to stop an injection: in the prompt, in the architecture, at the action, by origin, or at the input."
      />
      <div className="flex flex-col gap-4">{DEFENSES.map(row)}</div>
      <h2 className="label mt-6 !text-ink">Combining them</h2>
      {row(LAYERED)}
    </div>
  );
}
