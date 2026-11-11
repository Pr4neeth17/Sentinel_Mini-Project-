import { Check, X } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";

export interface ChipOption {
  id: string;
  short: string;
  name: string;
  blocks: boolean;
}

/**
 * Defense selector as a radio group (arrow keys move, roving tabindex).
 * Each chip shows a green check (blocks this attack) or a red cross (misses it).
 */
export function DefenseChips({ options, value, onChange }: { options: ChipOption[]; value: string; onChange: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + options.length) % options.length;
    onChange(options[j].id);
    refs.current[j]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Defense" className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            title={o.name}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`inline-flex h-9 items-center gap-2 rounded-control border px-3 text-sm transition-colors ${
              selected ? "border-accent bg-accent-soft text-ink" : "border-control bg-transparent text-ink hover:bg-raised"
            }`}
          >
            <span className={`font-mono text-[12px] font-semibold uppercase tracking-[0.06em] ${selected ? "text-accent" : ""}`}>{o.short}</span>
            <span className={`hidden xl:inline ${selected ? "" : "text-muted"}`}>{o.name}</span>
            {o.blocks ? (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-ok-soft text-ok-ink">
                <Check size={11} strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-danger-soft text-danger-ink">
                <X size={11} strokeWidth={3} aria-hidden />
              </span>
            )}
            <span className="sr-only">{o.blocks ? "blocks this attack" : "misses this attack"}</span>
          </button>
        );
      })}
    </div>
  );
}
