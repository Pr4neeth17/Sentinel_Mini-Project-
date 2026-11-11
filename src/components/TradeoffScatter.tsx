import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DefenseSummary } from "../lib/stats";
import { defenseLabel, defenseShort } from "../lib/defenses";
import { int } from "../lib/format";

interface Pt {
  id: string;
  label: string;
  x: number;
  y: number;
  n: number;
}

/** x = attack success (lower is better), y = utility under attack (higher is better). Ideal zone top-left. */
export function TradeoffScatter({ rows }: { rows: DefenseSummary[] }) {
  const data: Pt[] = rows
    .filter((d) => d.ASR && d.UA)
    .map((d) => ({ id: d.defense, label: defenseShort(d.defense), x: d.ASR!.p * 100, y: d.UA!.p * 100, n: d.n_attack }));

  const summary = data.map((d) => `${defenseLabel(d.id)}: ASR ${d.x.toFixed(1)}%, UA ${d.y.toFixed(1)}%`).join("; ");

  return (
    <div role="img" aria-label={`Trade-off between attack success and utility under attack. ${summary}.`}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 28, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" />
          <ReferenceArea
            x1={0}
            x2={15}
            y1={60}
            y2={100}
            fill="var(--active)"
            fillOpacity={1}
            stroke="none"
            label={{ value: "Ideal zone", position: "insideTopLeft", fill: "var(--muted)", fontSize: 12 }}
          />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 70]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--control)" }}
            tickLine={false}
            label={{ value: "Attack success (lower is better)", position: "insideBottom", offset: -14, fill: "var(--muted)", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Pt;
              return (
                <div className="rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink shadow-lg">
                  <div className="font-semibold">{defenseLabel(d.id)}</div>
                  <div className="num mt-0.5">
                    ASR {d.x.toFixed(1)}% · UA {d.y.toFixed(1)}% · n = {int(d.n)}
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.id === "none" ? "var(--faint)" : "var(--accent)"} />
            ))}
            <LabelList dataKey="label" position="right" offset={8} fill="var(--text)" fontSize={12} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
