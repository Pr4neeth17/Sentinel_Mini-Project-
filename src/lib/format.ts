/** 0.4213 -> "42.1%"; null -> "—" */
export function pct(p: number | null | undefined, digits = 1) {
  if (p === null || p === undefined || Number.isNaN(p)) return "—";
  return `${(p * 100).toFixed(digits)}%`;
}

/** Signed percentage-point change: +3.2 pts */
export function pts(d: number | null | undefined, digits = 1) {
  if (d === null || d === undefined || Number.isNaN(d)) return "—";
  const v = d * 100;
  if (Math.abs(v) < 0.05) return "0.0 pts";
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)} pts`;
}

export function int(n: number) {
  return n.toLocaleString("en-US");
}

/** Pretty-print a tool call: name(arg="x", n=3) */
export function formatCall(call: { name: string; args: Record<string, unknown> }) {
  const args = Object.entries(call.args ?? {})
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");
  return `${call.name}(${args})`;
}
