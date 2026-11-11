import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import type { DefenseSummary, Rate } from "../lib/stats";
import { defenseLabel } from "../lib/defenses";
import { int, pct } from "../lib/format";
import { Term } from "./Term";

type Key = "defense" | "BU" | "UA" | "ASR" | "n";

const val = (r: Rate | null) => (r ? r.p : -1);

export function Leaderboard({ rows }: { rows: DefenseSummary[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "ASR", dir: 1 });

  const sorted = useMemo(() => {
    const get = (d: DefenseSummary): number | string =>
      sort.key === "defense" ? defenseLabel(d.defense) : sort.key === "n" ? d.n_attack : val(d[sort.key]);
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * sort.dir;
    });
  }, [rows, sort]);

  const header = (key: Key, label: string, term?: string, numeric = true) => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
        className={`h-10 px-3 label ${numeric ? "text-right" : "text-left"} first:pl-0`}
      >
        <span className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "defense" || key === "ASR" ? 1 : -1 }))
            }
            className={`inline-flex items-center gap-1 rounded-control px-0.5 uppercase hover:text-ink ${active ? "text-accent" : ""}`}
          >
            {label}
            {active && (sort.dir === 1 ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />)}
          </button>
          {term && (
            <Term k={term}>
              <Info size={12} aria-hidden />
            </Term>
          )}
        </span>
      </th>
    );
  };

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">Defense leaderboard. Attack success: lower is better. Utilities: higher is better.</caption>
        <thead>
          <tr className="border-b border-border">
            {header("defense", "Defense", undefined, false)}
            {header("BU", "Benign utility", "BU")}
            {header("UA", "Utility under attack", "UA")}
            {header("ASR", "Attack success", "ASR")}
            <th scope="col" className="h-10 px-3 text-right label">
              <span className="inline-flex items-center gap-1">
                95% CI
                <Term k="CI">
                  <Info size={12} aria-hidden />
                </Term>
              </span>
            </th>
            {header("n", "n (attack)", "n")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.defense} className="border-b border-rule last:border-0">
              <th scope="row" className="h-12 py-2 pr-3 text-left font-medium text-ink">
                {defenseLabel(d.defense)}
              </th>
              <td className="num px-3 text-right text-ink">{pct(d.BU?.p)}</td>
              <td className="num px-3 text-right text-ink">{pct(d.UA?.p)}</td>
              <td className="num px-3 text-right font-semibold text-ink">{pct(d.ASR?.p)}</td>
              <td className="num px-3 text-right text-muted">
                {d.ASR ? `${pct(d.ASR.lo)} – ${pct(d.ASR.hi)}` : "—"}
              </td>
              <td className="num pl-3 text-right">
                <div className="text-ink">{int(d.n_attack)}</div>
                <div className="text-xs text-muted">{int(d.n_benign)} benign</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
