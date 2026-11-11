import type { TraceRow } from "../types";
import { defenseShort, familyLabel, outcomeLabel } from "../lib/defenses";
import { Pill, outcomeTone } from "./Badge";

/** Left list of runs. The selected row takes the active fill. */
export function TraceList({ traces, selected, onSelect }: { traces: TraceRow[]; selected?: string; onSelect: (id: string) => void }) {
  return (
    <ul className="flex flex-col gap-1" aria-label="Runs">
      {traces.map((t) => {
        const active = t.run_id === selected;
        return (
          <li key={t.run_id}>
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(t.run_id)}
              className={`flex w-full flex-col gap-1 rounded-control px-3 py-2.5 text-left transition-colors ${
                active ? "bg-active" : "hover:bg-raised"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-code text-ink">{t.run_id}</span>
                <Pill tone={outcomeTone(t.outcome)}>{outcomeLabel(t.outcome)}</Pill>
              </span>
              <span className="truncate text-xs text-muted">
                {defenseShort(t.defense)} · {familyLabel(t.family)} · {t.task}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
