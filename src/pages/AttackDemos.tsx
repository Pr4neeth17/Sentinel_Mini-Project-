import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Headset, Mail, Pause, Play, RotateCcw, ShoppingCart, SkipForward, Terminal, type LucideIcon } from "lucide-react";
import scenariosJson from "../data/scenarios.json";
import type { Scenario, ScenarioStep } from "../types";
import { DEFENSES } from "../lib/defenses";
import { Banner } from "../components/Banner";
import { DefenseChips, type ChipOption } from "../components/DefenseChips";
import { StepCard, type StepCardProps } from "../components/StepCard";
import { EmptyState } from "../components/EmptyState";
import { Button, PageHeader } from "../components/ui";
import { Term } from "../components/Term";

const SCENARIOS = scenariosJson as Scenario[];
const STEP_MS = 1100;

const ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  "shopping-cart": ShoppingCart,
  terminal: Terminal,
  headset: Headset,
};

type DefKey = keyof Scenario["def"];
const DEF_KEYS = DEFENSES.map((d) => d.id) as DefKey[];
/** Order the layers run in: filter, separation, provenance, validation. */
const LAYER_ORDER: DefKey[] = ["D5_filter", "D2_separate", "D4_provenance", "D3_validate"];

function verdict(s: Scenario, defense: string): { blocks: boolean; why: string } {
  if (defense === "layered") {
    const misses: string[] = [];
    for (const k of LAYER_ORDER) {
      const [b, why] = s.def[k];
      const short = DEFENSES.find((d) => d.id === k)!.short;
      if (b) {
        const lead = misses.length ? `${misses.join(" and ")} let it through, then ${short} caught it. ` : `${short} caught it first. `;
        return { blocks: true, why: lead + why };
      }
      misses.push(short);
    }
    return { blocks: false, why: "Every layer missed this one." };
  }
  const v = s.def[defense as DefKey];
  return v ? { blocks: v[0] === 1, why: v[1] } : { blocks: false, why: "No verdict recorded for this defense." };
}

const isCall = (x: string) => /^[A-Za-z_][\w.]*\([\s\S]*\)$/.test(x.trim());

function baseCard(st: ScenarioStep): StepCardProps {
  if (st.t === "agent" && isCall(st.x)) return { kind: "agent", code: st.x };
  return { kind: st.t, text: st.x, inj: st.inj };
}

export default function AttackDemos() {
  const [params, setParams] = useSearchParams();
  const scenario = SCENARIOS.find((s) => s.id === params.get("s")) ?? SCENARIOS[0];
  const defense = params.get("d") && [...DEF_KEYS, "layered"].includes(params.get("d")!) ? params.get("d")! : "D3_validate";

  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const total = scenario?.steps.length ?? 0;

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  // New scenario: start over.
  useEffect(() => {
    setStep(1);
    setPlaying(false);
  }, [scenario?.id]);

  // Play: one step every 1.1 s, stop on the last step.
  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(total, s + 1)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, total]);

  const options: ChipOption[] = useMemo(
    () =>
      scenario
        ? [
            ...DEFENSES.map((d) => ({ id: d.id, short: d.short, name: d.name, blocks: verdict(scenario, d.id).blocks })),
            { id: "layered", short: "Layered", name: "All of D2–D5", blocks: verdict(scenario, "layered").blocks },
          ]
        : [],
    [scenario],
  );

  if (!scenario) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Attack demos" />
        <EmptyState title="No scenarios found.">Add scenarios to src/data/scenarios.json (see README for the shape).</EmptyState>
      </div>
    );
  }

  const v = verdict(scenario, defense);
  const meta = defense === "layered" ? { short: "Layered", name: "D2 + D3 + D4 + D5" } : DEFENSES.find((d) => d.id === defense)!;
  const done = step >= total;
  const attackIdx = scenario.steps.findIndex((s) => s.a === 1);
  const attackShown = attackIdx !== -1 && step > attackIdx;

  const onPlay = () => {
    if (playing) return setPlaying(false);
    if (done) setStep(1);
    setPlaying(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attack demos"
        sub={
          <>
            Watch an agent read poisoned content and act on it — then replay the same run with a defense switched on. Yellow is{" "}
            <Term k="injection">injected text</Term>.
          </>
        }
      />

      <Banner>
        <span className="font-semibold">SIMULATED:</span> illustrative walkthroughs of common attack patterns, not measured results.
      </Banner>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Scenario rail */}
        <nav aria-label="Scenarios">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {SCENARIOS.map((s) => {
              const Icon = ICONS[s.icon] ?? Terminal;
              const active = s.id === scenario.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => set({ s: s.id })}
                    className={`flex w-full items-start gap-3 rounded-card border px-3.5 py-3 text-left transition-colors ${
                      active ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-raised"
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.75} className={`mt-0.5 flex-none ${active ? "text-accent" : "text-muted"}`} aria-hidden />
                    <span className="min-w-0">
                      <span className={`block font-mono text-[12.5px] font-medium uppercase tracking-[0.06em] ${active ? "text-accent" : "text-ink"}`}>{s.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="scenario-title" className="flex min-w-0 flex-col gap-5">
          {/* Scenario header + controls */}
          <div className="grid-bg flex flex-col gap-5 rounded-card border border-border bg-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="scenario-title" className="text-[26px] font-normal leading-8 tracking-[-0.02em] text-ink">
                  {scenario.name}
                </h2>
                <p className="mt-2 text-base text-ink">
                  <span className="label mr-2">User task</span>“{scenario.task}”
                </p>
              </div>
              <span className="fig">Simulated run</span>
            </div>

            <DefenseChips options={options} value={defense} onChange={(id) => set({ d: id })} />

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="brand" onClick={onPlay} aria-label={playing ? "Pause" : done ? "Replay from start" : "Play"}>
                {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
                {playing ? "Pause" : done ? "Replay" : "Play"}
              </Button>
              <Button onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={done || playing}>
                <SkipForward size={15} aria-hidden />
                Next step
              </Button>
              <Button variant="ghost" onClick={() => (setPlaying(false), setStep(1))} disabled={step === 1 && !playing}>
                <RotateCcw size={15} aria-hidden />
                Reset
              </Button>
              <span className="label num ml-auto !text-ink" aria-live="polite">
                Step {step} of {total}
              </span>
            </div>
            {/* One segment per step; the attack step is marked. */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden>
              {scenario.steps.map((s, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-[1px] transition-colors duration-300"
                  style={{ background: i < step ? (s.a === 1 ? "var(--danger)" : "var(--text)") : "var(--active)" }}
                />
              ))}
            </div>
          </div>

          {/* Two synced columns */}
          <div className="hidden grid-cols-2 gap-4 md:grid">
            <h3 className="label !text-ink">Without defense</h3>
            <h3 className="label !text-ink">
              With <span className="text-accent">{meta.short}</span> · <span className="text-muted">{meta.name}</span>
            </h3>
          </div>

          <ol className="flex flex-col gap-3" aria-label="Agent run, step by step">
            {scenario.steps.slice(0, step).map((st, i) => {
              const card = baseCard(st);
              if (st.a === 1) {
                return (
                  <li key={`${scenario.id}-${i}`} className="grid gap-3 md:grid-cols-2 md:gap-4">
                    <div>
                      <p className="label mb-1.5 md:hidden">Without defense</p>
                      <StepCard {...card} state="attack" goal={st.goal} animate />
                    </div>
                    <div>
                      <p className="label mb-1.5 md:hidden">With {meta.short}</p>
                      {v.blocks ? (
                        <StepCard {...card} state="blocked" reason={v.why} animate />
                      ) : (
                        <StepCard {...card} state="missed" reason={v.why} goal={st.goal} animate />
                      )}
                    </div>
                  </li>
                );
              }
              return (
                <li key={`${scenario.id}-${i}`} className="grid gap-4 md:grid-cols-2">
                  <StepCard {...card} animate />
                  <div className="hidden md:block" aria-hidden>
                    <StepCard {...card} animate />
                  </div>
                </li>
              );
            })}
          </ol>

          {done && attackShown && (
            <div className="grid gap-3 md:grid-cols-2 md:gap-4 step-in" aria-live="polite">
              <p className="rounded-card border border-border bg-raised px-4 py-3 text-sm text-ink">
                <span className="font-semibold">Outcome without defense:</span> the user got a normal-looking answer while the attacker’s
                action ran in the background.
              </p>
              <p className="rounded-card border border-border bg-raised px-4 py-3 text-sm text-ink">
                <span className="font-semibold">Outcome with {meta.short}:</span>{" "}
                {v.blocks
                  ? "the task finished and the attacker’s action never ran."
                  : "the attacker’s action still ran. Try Layered to see a second line of defense catch it."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
