import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CircleCheck, CircleDashed, Upload, WifiOff } from "lucide-react";
import { useData, type FileLoadReport } from "../context/DataContext";
import { apiConfigured, apiLabel, getRunStatus, pingBackend, startRun, type BackendState } from "../api";
import { DEFENSE_ORDER, defenseLabel, familyLabel } from "../lib/defenses";
import { unique } from "../lib/stats";
import { int } from "../lib/format";
import { Button, PageHeader, Panel, Select } from "../components/ui";

const FAMILIES = ["naive", "context_ignore", "fake_completion", "combined"];
const MODELS = ["qwen2.5-7b-instruct", "llama3.1-8b-instruct", "gpt-4o-mini"];

function BackendPill({ state }: { state: BackendState }) {
  const map: Record<BackendState, { label: string; Icon: typeof WifiOff }> = {
    "not-configured": { label: "Not configured", Icon: CircleDashed },
    checking: { label: "Checking…", Icon: CircleDashed },
    online: { label: "Online", Icon: CircleCheck },
    offline: { label: "Offline", Icon: WifiOff },
  };
  const { label, Icon } = map[state];
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-control px-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${state === "online" ? "border border-control text-ink" : "bg-active text-muted"}`}>
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
}

function FileLoader({ label, hint, onLoad, loadedName }: { label: string; hint: string; onLoad: (text: string, name: string) => FileLoadReport; loadedName?: string }) {
  const [report, setReport] = useState<(FileLoadReport & { name: string }) | null>(null);
  const [reading, setReading] = useState(false);
  const id = `file-${label.replace(/\W/g, "")}`;

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReading(true);
    try {
      const text = await f.text();
      setReport({ ...onLoad(text, f.name), name: f.name });
    } catch {
      setReport({ ok: false, loaded: 0, errors: [{ line: 0, message: "couldn’t read the file" }], name: f.name });
    } finally {
      setReading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label !text-ink">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-control border border-control px-3.5 font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-ink hover:bg-raised focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]"
        >
          <Upload size={15} aria-hidden />
          {reading ? "Reading…" : "Choose file"}
          <input id={id} type="file" accept=".jsonl,.ndjson,.json,.txt" className="sr-only" onChange={onChange} aria-describedby={`${id}-hint`} />
        </label>
        <span className="text-sm text-muted">{loadedName ? `Loaded: ${loadedName}` : "Using current data"}</span>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </p>
      {report && (
        <div role="status" className="rounded-control bg-raised px-3 py-2 text-sm">
          {report.ok ? (
            <span className="text-ink">
              Loaded {int(report.loaded)} rows from {report.name}.
              {report.errors.length > 0 && ` Skipped ${report.errors.length} invalid line${report.errors.length > 1 ? "s" : ""}.`}
            </span>
          ) : (
            <span className="text-ink">No valid rows in {report.name}. Nothing was replaced.</span>
          )}
          {report.errors.length > 0 && (
            <ul className="mt-1 max-h-28 overflow-auto font-mono text-code text-muted">
              {report.errors.slice(0, 8).map((e) => (
                <li key={e.line}>
                  line {e.line}: {e.message}
                </li>
              ))}
              {report.errors.length > 8 && <li>…and {report.errors.length - 8} more</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const CONTRACT = `POST /api/run            {model, defenses[], families[], reps, seed} -> {run_id}
GET  /api/runs/{id}/status                                    -> {done, total}
GET  /api/results                                             -> JSONL of result rows
GET  /api/traces/{id}      ("latest" = most recent run)       -> JSONL of trace rows

result row
{"task_id":"banking/user_task_7+injection_task_1","defense":"D3_validate",
 "model":"qwen2.5-7b-instruct","attack_family":"fake_completion",
 "attack_success":false,"task_success":true,"blocked":1}
 attack_family = null  -> benign run

trace row
{"run_id":"tr_002","task":"…","defense":"D3_validate","family":"context_ignore",
 "outcome":"blocked","steps":[{"role":"user","text":"…"},
 {"role":"tool","text":"…","inj":"<the injected span>"},
 {"role":"agent","call":{"name":"forward_emails","args":{…}},
  "flag":"blocked","note":"why"}]}`;

export default function Lab() {
  const data = useData();
  const [backend, setBackend] = useState<BackendState>(apiConfigured ? "checking" : "not-configured");
  const [model, setModel] = useState(MODELS[0]);
  const [reps, setReps] = useState(3);
  const [seed, setSeed] = useState(42);
  const [defenses, setDefenses] = useState<string[]>(DEFENSE_ORDER);
  const [families, setFamilies] = useState<string[]>(FAMILIES);
  const [run, setRun] = useState<{ id: string; done: number; total: number } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const poll = useRef<number | null>(null);

  const check = async () => {
    setBackend(apiConfigured ? "checking" : "not-configured");
    setBackend(await pingBackend());
  };

  useEffect(() => {
    void check();
    return () => {
      if (poll.current) window.clearInterval(poll.current);
    };
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const running = run !== null && run.done < run.total;
  const canRun = backend === "online" && defenses.length > 0 && families.length > 0 && !running && !submitting;
  const disabledReason =
    backend === "not-configured"
      ? "Set VITE_API_URL to a backend (or run npm run dev:mock) to start runs."
      : backend === "offline"
        ? `Backend at ${apiLabel} isn’t answering. Start it and press Check again.`
        : backend === "checking"
          ? "Checking the backend…"
          : defenses.length === 0
            ? "Pick at least one defense."
            : families.length === 0
              ? "Pick at least one attack family."
              : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canRun) return;
    setRunError(null);
    setSubmitting(true);
    try {
      const { run_id } = await startRun({ model, defenses, families, reps, seed });
      setRun({ id: run_id, done: 0, total: 0 });
      poll.current = window.setInterval(async () => {
        try {
          const s = await getRunStatus(run_id);
          setRun({ id: run_id, ...s });
          if (s.total > 0 && s.done >= s.total) {
            window.clearInterval(poll.current!);
            poll.current = null;
            await data.reload();
          }
        } catch (err) {
          window.clearInterval(poll.current!);
          poll.current = null;
          setRunError(`Lost track of ${run_id}: ${(err as Error).message}`);
        }
      }, 1000);
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadedDefenses = useMemo(() => unique(data.results.map((r) => r.defense)), [data.results]);
  const progress = run && run.total > 0 ? run.done / run.total : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Lab" sub="Start evaluation runs on the backend, or load result files from a run you did elsewhere." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="New run" aside={<BackendPill state={backend} />}>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4">
              <Select label="Model" value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Repetitions
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={reps}
                  onChange={(e) => setReps(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  className="num h-9 w-28 rounded-control border border-control bg-surface px-2.5 text-sm font-normal"
                  aria-describedby="reps-hint"
                />
                <span id="reps-hint" className="text-xs font-normal text-muted">
                  1–50 per task
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Seed
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  className="num h-9 w-28 rounded-control border border-control bg-surface px-2.5 text-sm font-normal"
                />
              </label>
            </div>

            <fieldset>
              <legend className="label">Defenses</legend>
              <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {DEFENSE_ORDER.map((d) => (
                  <label key={d} className="flex min-h-[32px] items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent-fill)]" checked={defenses.includes(d)} onChange={() => toggle(defenses, setDefenses, d)} />
                    {defenseLabel(d)}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Attack families</legend>
              <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {FAMILIES.map((f) => (
                  <label key={f} className="flex min-h-[32px] items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent-fill)]" checked={families.includes(f)} onChange={() => toggle(families, setFamilies, f)} />
                    {familyLabel(f)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canRun}
                aria-describedby="run-hint"
                className="inline-flex h-9 items-center rounded-control bg-accent-soft px-4 font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-accent transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Starting…" : running ? "Running…" : "Start run"}
              </button>
              <span id="run-hint" className="text-sm text-muted">
                {disabledReason ?? `${defenses.length} defenses × ${families.length} families × ${reps} reps`}
              </span>
            </div>

            {run && (
              <div className="flex flex-col gap-2" aria-live="polite">
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-code text-ink">{run.id}</span>
                  <span className="num text-muted">
                    {run.total ? `${int(run.done)} of ${int(run.total)} runs` : "Queued…"}
                    {run.total > 0 && run.done >= run.total && " · done, results reloaded"}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Run progress"
                  aria-valuemin={0}
                  aria-valuemax={run.total || 1}
                  aria-valuenow={run.done}
                  className="h-2 overflow-hidden rounded-full bg-active"
                >
                  <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}
            {runError && (
              <p role="alert" className="rounded-control bg-raised px-3 py-2 text-sm text-ink">
                {runError} Check the backend logs, then try again.
              </p>
            )}
          </form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Backend" aside={<Button variant="ghost" onClick={() => void check()}>Check again</Button>}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="label pt-0.5">Status</dt>
              <dd>
                <BackendPill state={backend} />
              </dd>
              <dt className="label pt-0.5">URL</dt>
              <dd className="break-all font-mono text-code text-ink">{apiConfigured ? apiLabel : "— (VITE_API_URL unset)"}</dd>
              <dt className="label pt-0.5">Showing</dt>
              <dd className="text-ink">
                {data.source} · {int(data.results.length)} result rows · {data.traces.length} traces · {loadedDefenses.length} defenses
              </dd>
              {data.rejected > 0 && (
                <>
                  <dt className="label pt-0.5">Rejected</dt>
                  <dd className="text-ink">{data.rejected} rows failed the contract check</dd>
                </>
              )}
            </dl>
          </Panel>

          <Panel title="Load files" aside={data.source === "FROM FILE" ? <Button variant="ghost" onClick={data.resetToDemo}>Back to demo data</Button> : undefined}>
            <div className="flex flex-col gap-5">
              <FileLoader
                label="results.jsonl"
                hint="One result row per line. Replaces the data on Overview, Results and Defenses."
                onLoad={data.loadResultsFile}
                loadedName={data.fileNames.results}
              />
              <FileLoader
                label="traces.jsonl"
                hint="One trace row per line. Replaces the runs in the Trace viewer."
                onLoad={data.loadTracesFile}
                loadedName={data.fileNames.traces}
              />
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Backend contract" aside="Full spec: docs/backend-contract.md · JSON Schemas: contracts/">
        <pre className="overflow-x-auto rounded-control bg-raised p-4 font-mono text-code text-ink">{CONTRACT}</pre>
      </Panel>
    </div>
  );
}
