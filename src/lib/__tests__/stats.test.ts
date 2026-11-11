import { describe, expect, it } from "vitest";
import { aggregate, asrMatrix, filterRows, wilson } from "../stats";
import { parseResults, parseTraces } from "../parseJsonl";
import type { ResultRow } from "../../types";

const close = (a: number, b: number, eps = 1e-4) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe("wilson", () => {
  it("matches known values for 5/10", () => {
    const w = wilson(5, 10)!;
    close(w.p, 0.5);
    close(w.lo, 0.236593);
    close(w.hi, 0.763407);
  });

  it("matches known values for 81/263", () => {
    const w = wilson(81, 263)!;
    // p = 0.30798; centre 0.310744 ± 0.055462
    close(w.lo, 0.255282, 1e-4);
    close(w.hi, 0.366206, 1e-4);
  });

  it("stays inside [0, 1] at k = 0 and k = n", () => {
    const zero = wilson(0, 10)!;
    expect(zero.lo).toBe(0);
    close(zero.hi, 0.277533);
    const all = wilson(10, 10)!;
    expect(all.hi).toBe(1);
    close(all.lo, 0.722467);
  });

  it("returns null when there is no data", () => {
    expect(wilson(0, 0)).toBeNull();
  });

  it("narrows as n grows", () => {
    const small = wilson(3, 10)!;
    const big = wilson(300, 1000)!;
    expect(big.hi - big.lo).toBeLessThan(small.hi - small.lo);
  });

  it("rejects k outside 0..n", () => {
    expect(() => wilson(11, 10)).toThrow(RangeError);
  });
});

const row = (p: Partial<ResultRow>): ResultRow => ({
  task_id: "t",
  defense: "none",
  model: "m1",
  attack_family: "naive",
  attack_success: false,
  task_success: false,
  blocked: 0,
  ...p,
});

const rows: ResultRow[] = [
  // none: 2 benign (1 ok), 4 attack (3 succeed, 1 task ok)
  row({ attack_family: null, task_success: true }),
  row({ attack_family: null, task_success: false }),
  row({ attack_success: true }),
  row({ attack_success: true }),
  row({ attack_success: true, attack_family: "combined" }),
  row({ attack_success: false, task_success: true, attack_family: "combined" }),
  // D3: 1 benign ok, 2 attack (0 succeed, both task ok), other model
  row({ defense: "D3_validate", attack_family: null, task_success: true }),
  row({ defense: "D3_validate", task_success: true, blocked: 1 }),
  row({ defense: "D3_validate", task_success: true, blocked: 2, model: "m2" }),
];

describe("aggregate", () => {
  it("computes BU on benign rows and UA / ASR on attack rows", () => {
    const [none, d3] = aggregate(rows);
    expect(none.defense).toBe("none");
    expect(none.n_benign).toBe(2);
    expect(none.n_attack).toBe(4);
    close(none.BU!.p, 0.5);
    close(none.ASR!.p, 0.75);
    close(none.UA!.p, 0.25);
    expect(d3.defense).toBe("D3_validate");
    close(d3.ASR!.p, 0);
    close(d3.UA!.p, 1);
    expect(d3.blocked).toBe(3);
  });

  it("attaches Wilson intervals with k and n", () => {
    const [none] = aggregate(rows);
    expect(none.ASR!.k).toBe(3);
    expect(none.ASR!.n).toBe(4);
    const w = wilson(3, 4)!;
    close(none.ASR!.lo, w.lo);
    close(none.ASR!.hi, w.hi);
  });

  it("filters by model", () => {
    const d3 = aggregate(rows, { model: "m2" }).find((d) => d.defense === "D3_validate")!;
    expect(d3.n_attack).toBe(1);
    expect(d3.BU).toBeNull();
  });

  it("filters by family but keeps benign rows for BU", () => {
    const none = aggregate(rows, { family: "combined" }).find((d) => d.defense === "none")!;
    expect(none.n_attack).toBe(2);
    expect(none.n_benign).toBe(2);
    close(none.ASR!.p, 0.5);
    expect(filterRows(rows, { family: "combined" }).length).toBe(5);
  });

  it("orders defenses canonically", () => {
    const ids = aggregate([row({ defense: "layered" }), row({ defense: "D1_delimit" }), row({ defense: "none" })]).map((d) => d.defense);
    expect(ids).toEqual(["none", "D1_delimit", "layered"]);
  });

  it("returns an empty list for no rows", () => {
    expect(aggregate([])).toEqual([]);
  });

  it("builds the ablation matrix", () => {
    const m = asrMatrix(rows);
    expect(m.families).toEqual(["naive", "combined"]);
    expect(m.defenses).toEqual(["none", "D3_validate"]);
    close(m.cells[0][0]!.p, 1);
    close(m.cells[0][1]!.p, 0.5);
    expect(m.cells[1][1]).toBeNull();
  });
});

describe("parseJsonl", () => {
  it("parses valid rows and reports bad lines by number", () => {
    const text = [
      JSON.stringify(row({})),
      "",
      "{not json",
      JSON.stringify({ ...row({}), blocked: "no" }),
      JSON.stringify(row({ attack_family: null })),
    ].join("\n");
    const r = parseResults(text);
    expect(r.rows.length).toBe(2);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
  });

  it("validates trace steps", () => {
    const ok = { run_id: "r", task: "t", defense: "none", family: null, outcome: "blocked", steps: [{ role: "user", text: "hi" }] };
    const bad = { ...ok, steps: [{ role: "agent", flag: "maybe" }] };
    const r = parseTraces([JSON.stringify(ok), JSON.stringify(bad)].join("\n"));
    expect(r.rows.length).toBe(1);
    expect(r.errors[0].message).toMatch(/flag/);
  });
});
