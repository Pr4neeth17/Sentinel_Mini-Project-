import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { aggregate, asrMatrix, unique } from "../lib/stats";
import { defenseLabel, familyLabel } from "../lib/defenses";
import { int, pct } from "../lib/format";
import { Leaderboard } from "../components/Leaderboard";
import { AsrBars } from "../components/AsrBars";
import { TradeoffScatter } from "../components/TradeoffScatter";
import { EmptyState } from "../components/EmptyState";
import { Skeleton, SkeletonRows } from "../components/Skeleton";
import { Button, LinkButton, PageHeader, Panel, Reading, Select } from "../components/ui";
import { Term } from "../components/Term";

export default function Results() {
  const { results, status, error, reload, source } = useData();
  const [params, setParams] = useSearchParams();
  const model = params.get("model") || "";
  const family = params.get("family") || "";

  const models = useMemo(() => unique(results.map((r) => r.model)).sort(), [results]);
  const families = useMemo(
    () => unique(results.filter((r) => r.attack_family !== null).map((r) => r.attack_family as string)),
    [results],
  );
  const summary = useMemo(() => aggregate(results, { model: model || null, family: family || null }), [results, model, family]);
  const matrix = useMemo(() => asrMatrix(results, model || null), [results, model]);

  const setFilter = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const base = summary.find((d) => d.defense === "none");
  const best = summary.filter((d) => d.defense !== "none" && d.ASR).sort((a, b) => a.ASR!.p - b.ASR!.p)[0];
  const nAttack = summary.reduce((s, d) => s + d.n_attack, 0);
  const nBenign = summary.reduce((s, d) => s + d.n_benign, 0);

  const header = (
    <PageHeader
      title="Results"
      sub={
        status === "ready" && results.length > 0 ? (
          <>
            {int(nAttack)} attack runs and {int(nBenign)} benign runs across {summary.length} configurations
            {source === "DEMO" && " · demo data"}.
          </>
        ) : (
          "Attack success and utility for every defense, with 95% intervals."
        )
      }
    />
  );

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Panel title="Leaderboard">
          <SkeletonRows rows={7} />
        </Panel>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Attack success by defense">
            <Skeleton className="h-[280px] w-full" />
          </Panel>
          <Panel title="Security vs utility">
            <Skeleton className="h-[280px] w-full" />
          </Panel>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState title="Couldn’t load results." action={<Button onClick={() => void reload()}>Retry</Button>}>
          {error} If the backend is down, load a results.jsonl in Lab instead.
        </EmptyState>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState title="No results yet." action={<LinkButton to="/lab">Open Lab</LinkButton>}>
          Run an evaluation from Lab, or load a results.jsonl file.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Model" value={model} onChange={(e) => setFilter("model", e.target.value)}>
          <option value="">All models</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Select label="Attack family" value={family} onChange={(e) => setFilter("family", e.target.value)}>
          <option value="">All families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {familyLabel(f)}
            </option>
          ))}
        </Select>
        {(model || family) && (
          <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </Button>
        )}
      </div>

      {summary.length === 0 || nAttack === 0 ? (
        <EmptyState title="No runs match these filters." action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}>
          Try another model or attack family.
        </EmptyState>
      ) : (
        <>
          <Panel
            fig="Fig. 1"
            title="Leaderboard"
            aside={best && base?.ASR ? `${defenseLabel(best.defense)} cuts attack success from ${pct(base.ASR.p)} to ${pct(best.ASR!.p)}` : undefined}
          >
            <Leaderboard rows={summary} />
            <Reading>
              <Term k="ASR">Attack success</Term>: lower is better. <Term k="BU">Benign utility</Term> and{" "}
              <Term k="UA">utility under attack</Term>: higher is better. Click a column to sort.
            </Reading>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel fig="Fig. 2" title="Attack success by defense" aside={`n = ${int(summary[0]?.n_attack ?? 0)} attack runs each`}>
              <AsrBars rows={summary} />
              <Reading>Lower is better. Whiskers are the 95% Wilson interval; overlapping whiskers mean the difference may be noise.</Reading>
            </Panel>
            <Panel fig="Fig. 3" title="Security vs utility" aside="Each dot is one defense">
              <TradeoffScatter rows={summary} />
              <Reading>Top-left is best: few attacks get through and the agent still does the job.</Reading>
            </Panel>
          </div>

          <Panel fig="Fig. 4" title="Ablation: attack success by family" aside={model ? model : "All models"}>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <caption className="sr-only">Attack success rate for each defense against each attack family.</caption>
                <thead>
                  <tr>
                    <th scope="col" className="h-10 pr-3 text-left label">
                      Defense
                    </th>
                    {matrix.families.map((f) => (
                      <th key={f} scope="col" className="h-10 px-2 text-right label">
                        {familyLabel(f)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.defenses.map((d, i) => (
                    <tr key={d}>
                      <th scope="row" className="h-12 pr-3 text-left font-medium text-ink">
                        {defenseLabel(d)}
                      </th>
                      {matrix.cells[i].map((c, j) => (
                        <td key={j} className="p-1">
                          <div
                            className="num flex h-11 flex-col items-end justify-center rounded-control px-2.5"
                            style={{
                              // Tint capped at 75% so ink text keeps 4.5:1 in both themes.
                              background: c ? `color-mix(in srgb, var(--accent) ${Math.round(Math.min(1, c.p / 0.8) * 75)}%, var(--surface))` : "var(--raised)",
                              color: "var(--text)",
                            }}
                          >
                            <span className="font-medium">{c ? pct(c.p, 0) : "—"}</span>
                            <span className="text-xs opacity-80">n={c?.n ?? 0}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Reading>Darker cells mean more attacks got through. Read across a row to see which attack style beats a defense.</Reading>
          </Panel>
        </>
      )}
    </div>
  );
}
