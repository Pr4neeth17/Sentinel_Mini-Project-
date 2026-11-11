import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DefenseSummary } from "../lib/stats";
import { defenseLabel, defenseShort } from "../lib/defenses";
import { int, pct } from "../lib/format";

interface Datum {
  id: string;
  label: string;
  asr: number;
  err: [number, number];
  lo: number;
  hi: number;
  n: number;
}

/** Horizontal bars of attack success with 95% Wilson whiskers. Baseline in grey, defenses in the brand hue. */
export function AsrBars({ rows }: { rows: DefenseSummary[] }) {
  const data: Datum[] = rows
    .filter((d) => d.ASR)
    .map((d) => ({
      id: d.defense,
      label: defenseShort(d.defense),
      asr: d.ASR!.p * 100,
      err: [(d.ASR!.p - d.ASR!.lo) * 100, (d.ASR!.hi - d.ASR!.p) * 100],
      lo: d.ASR!.lo,
      hi: d.ASR!.hi,
      n: d.ASR!.n,
    }));

  const summary = data.map((d) => `${defenseLabel(d.id)} ${d.asr.toFixed(1)}%`).join(", ");

  return (
    <div role="img" aria-label={`Attack success rate by defense, with 95% confidence intervals. ${summary}.`}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36 + 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--control)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={64}
            tick={{ fill: "var(--text)", fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--active)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Datum;
              return (
                <div className="rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink shadow-lg">
                  <div className="font-semibold">{defenseLabel(d.id)}</div>
                  <div className="num mt-0.5">
                    ASR {d.asr.toFixed(1)}% · 95% CI {pct(d.lo)}–{pct(d.hi)} · n = {int(d.n)}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="asr" isAnimationActive={false} radius={[0, 1, 1, 0]}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.id === "none" ? "var(--faint)" : "var(--accent)"} />
            ))}
            <ErrorBar dataKey="err" direction="x" width={8} strokeWidth={1.5} stroke="var(--text)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
