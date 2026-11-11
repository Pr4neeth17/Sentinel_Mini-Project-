import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "../context/DataContext";
import type { TraceRow, TraceStep } from "../types";
import { DEFENSE_ORDER, defenseLabel, familyLabel, outcomeLabel } from "../lib/defenses";
import { formatCall } from "../lib/format";
import { unique } from "../lib/stats";
import { TraceList } from "../components/TraceList";
import { StepCard, type StepKind } from "../components/StepCard";
import { Pill, outcomeTone } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SkeletonRows } from "../components/Skeleton";
import { Button, LinkButton, PageHeader, Select } from "../components/ui";

const KINDS: StepKind[] = ["user", "tool", "agent", "system"];

function StepView({ s }: { s: TraceStep }) {
  const kind: StepKind = (KINDS as string[]).includes(s.role) ? (s.role as StepKind) : s.role === "assistant" ? "agent" : "system";
  const code = s.call ? formatCall(s.call) : undefined;
  if (s.flag === "attack") return <StepCard kind={kind} code={code} text={s.text} state="attack" reason={s.note} />;
  if (s.flag === "blocked") return <StepCard kind={kind} code={code} text={s.text} state="blocked" reason={s.note} />;
  return (
    <>
      {s.text && <StepCard kind={kind} text={s.text} inj={s.inj} />}
      {code && <StepCard kind={kind} code={code} />}
      {s.note && <p className="-mt-1 px-1 text-xs text-muted">{s.note}</p>}
    </>
  );
}

function TraceDetail({ t, onBack }: { t: TraceRow; onBack: () => void }) {
  return (
    <article aria-labelledby="trace-title" className="flex min-w-0 flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-ink lg:hidden">
        <ArrowLeft size={14} aria-hidden /> All runs
      </button>
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="trace-title" className="font-mono text-base text-ink">
            {t.run_id}
          </h2>
          <Pill tone={outcomeTone(t.outcome)}>{outcomeLabel(t.outcome)}</Pill>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="label pt-0.5">Task</dt>
          <dd className="break-all font-mono text-code text-ink">{t.task}</dd>
          <dt className="label pt-0.5">Defense</dt>
          <dd className="text-ink">{defenseLabel(t.defense)}</dd>
          <dt className="label pt-0.5">Attack family</dt>
          <dd className="text-ink">{familyLabel(t.family)}</dd>
        </dl>
      </header>
      {t.steps.length === 0 ? (
        <EmptyState title="This run has no recorded steps." />
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Conversation">
          {t.steps.map((s, i) => (
            <li key={i} className="flex flex-col gap-3">
              <StepView s={s} />
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export default function Traces() {
  const { traces, status, error, reload } = useData();
  const [params, setParams] = useSearchParams();
  const run = params.get("run");
  const def = params.get("defense") || "";
  const outcome = params.get("outcome") || "";
  const detailRef = useRef<HTMLDivElement>(null);

  const defenses = useMemo(
    () => unique(traces.map((t) => t.defense)).sort((a, b) => DEFENSE_ORDER.indexOf(a) - DEFENSE_ORDER.indexOf(b)),
    [traces],
  );
  const outcomes = useMemo(() => unique(traces.map((t) => t.outcome)), [traces]);
  const shown = traces.filter((t) => (!def || t.defense === def) && (!outcome || t.outcome === outcome));
  const selected = traces.find((t) => t.run_id === run) ?? null;

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: k !== "run" });
  };

  // On desktop, open the first run so the screen is never empty.
  useEffect(() => {
    if (!run && shown.length && window.matchMedia("(min-width: 1024px)").matches) set("run", shown[0].run_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, shown.length]);

  const header = (
    <PageHeader
      title="Trace viewer"
      sub="Every step of a recorded run. Injected text is highlighted; the attacker’s action is flagged red if it ran, green if a defense blocked it."
    />
  );

  if (status === "loading")
    return (
      <div className="flex flex-col gap-6">
        {header}
        <SkeletonRows rows={8} />
      </div>
    );

  if (status === "error")
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState title="Couldn’t load traces." action={<Button onClick={() => void reload()}>Retry</Button>}>
          {error} You can also load a traces.jsonl file in Lab.
        </EmptyState>
      </div>
    );

  if (traces.length === 0)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState title="No traces recorded." action={<LinkButton to="/lab">Open Lab</LinkButton>}>
          Traces appear here after a run, or when you load a traces.jsonl file.
        </EmptyState>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`flex flex-col gap-3 ${selected ? "hidden lg:flex" : "flex"}`} aria-label="Run list">
          <div className="grid grid-cols-2 gap-2">
            <Select label="Defense" value={def} onChange={(e) => set("defense", e.target.value)} className="[&>select]:min-w-0">
              <option value="">All</option>
              {defenses.map((d) => (
                <option key={d} value={d}>
                  {defenseLabel(d)}
                </option>
              ))}
            </Select>
            <Select label="Outcome" value={outcome} onChange={(e) => set("outcome", e.target.value)} className="[&>select]:min-w-0">
              <option value="">All</option>
              {outcomes.map((o) => (
                <option key={o} value={o}>
                  {outcomeLabel(o)}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-muted">
            {shown.length} of {traces.length} runs
          </p>
          {shown.length === 0 ? (
            <EmptyState title="No runs match." action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>} />
          ) : (
            <TraceList traces={shown} selected={run ?? undefined} onSelect={(id) => set("run", id)} />
          )}
        </aside>
        <div ref={detailRef} className={selected ? "" : "hidden lg:block"}>
          {selected ? (
            <TraceDetail t={selected} onBack={() => set("run", null)} />
          ) : run ? (
            <EmptyState title={`Run “${run}” isn’t in the loaded traces.`} action={<Button onClick={() => set("run", null)}>Show all runs</Button>} />
          ) : (
            <EmptyState title="Pick a run from the list." />
          )}
        </div>
      </div>
    </div>
  );
}
