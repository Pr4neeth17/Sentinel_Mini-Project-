import type { ResultRow } from "../types";
import { DEFENSE_ORDER } from "./defenses";

export interface Interval {
  p: number;
  lo: number;
  hi: number;
}

/**
 * Wilson score interval for a binomial proportion k/n.
 * Returns null when n is 0 (no data, so no rate).
 */
export function wilson(k: number, n: number, z = 1.96): Interval | null {
  if (!Number.isFinite(k) || !Number.isFinite(n) || n <= 0) return null;
  if (k < 0 || k > n) throw new RangeError(`wilson: k=${k} outside 0..${n}`);
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { p, lo: Math.max(0, center - half), hi: Math.min(1, center + half) };
}

export interface Rate extends Interval {
  k: number;
  n: number;
}

function rate(k: number, n: number): Rate | null {
  const w = wilson(k, n);
  return w ? { ...w, k, n } : null;
}

export interface DefenseSummary {
  defense: string;
  /** Benign utility: task_success rate on benign rows. */
  BU: Rate | null;
  /** Utility under attack: task_success rate on attack rows. */
  UA: Rate | null;
  /** Attack success rate on attack rows. */
  ASR: Rate | null;
  n_benign: number;
  n_attack: number;
  blocked: number;
}

export interface AggregateFilter {
  model?: string | null;
  family?: string | null;
}

/** Keep rows matching the filter. A family filter keeps benign rows so BU stays defined. */
export function filterRows(rows: ResultRow[], f: AggregateFilter = {}): ResultRow[] {
  return rows.filter(
    (r) =>
      (!f.model || r.model === f.model) &&
      (!f.family || r.attack_family === null || r.attack_family === f.family),
  );
}

/** Per-defense BU / UA / ASR with Wilson 95% intervals. Sorted in the canonical defense order. */
export function aggregate(rows: ResultRow[], f: AggregateFilter = {}): DefenseSummary[] {
  const acc = new Map<string, { b: number; bs: number; a: number; as: number; at: number; blk: number }>();
  for (const r of filterRows(rows, f)) {
    let s = acc.get(r.defense);
    if (!s) {
      s = { b: 0, bs: 0, a: 0, as: 0, at: 0, blk: 0 };
      acc.set(r.defense, s);
    }
    s.blk += r.blocked || 0;
    if (r.attack_family === null) {
      s.b += 1;
      if (r.task_success) s.bs += 1;
    } else {
      s.a += 1;
      if (r.task_success) s.at += 1;
      if (r.attack_success) s.as += 1;
    }
  }
  const out: DefenseSummary[] = [];
  for (const [defense, s] of acc) {
    out.push({
      defense,
      BU: rate(s.bs, s.b),
      UA: rate(s.at, s.a),
      ASR: rate(s.as, s.a),
      n_benign: s.b,
      n_attack: s.a,
      blocked: s.blk,
    });
  }
  return out.sort((x, y) => orderOf(x.defense) - orderOf(y.defense) || x.defense.localeCompare(y.defense));
}

function orderOf(id: string) {
  const i = DEFENSE_ORDER.indexOf(id);
  return i === -1 ? DEFENSE_ORDER.length : i;
}

/** ASR per defense x family, for the ablation matrix. */
export function asrMatrix(rows: ResultRow[], model?: string | null) {
  const families = unique(rows.filter((r) => r.attack_family !== null).map((r) => r.attack_family as string));
  const defenses = aggregate(rows, { model }).map((d) => d.defense);
  const cells = defenses.map((defense) =>
    families.map((family) => {
      const rs = rows.filter(
        (r) => r.defense === defense && r.attack_family === family && (!model || r.model === model),
      );
      return rate(rs.filter((r) => r.attack_success).length, rs.length);
    }),
  );
  return { defenses, families, cells };
}

export function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
