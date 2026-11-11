import type { ResultRow, TraceRow } from "../types";

export interface ParseResult<T> {
  rows: T[];
  errors: { line: number; message: string }[];
}

/** Parse JSON Lines. Blank lines are skipped; each bad line is reported with its 1-based number. */
export function parseJsonl<T>(text: string, validate?: (v: unknown) => string | null): ParseResult<T> {
  const rows: T[] = [];
  const errors: ParseResult<T>["errors"] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let v: unknown;
    try {
      v = JSON.parse(line);
    } catch {
      errors.push({ line: i + 1, message: "not valid JSON" });
      return;
    }
    const problem = validate?.(v);
    if (problem) {
      errors.push({ line: i + 1, message: problem });
      return;
    }
    rows.push(v as T);
  });
  return { rows, errors };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Field and type checks matching contracts/result-row.schema.json */
export function validateResultRow(v: unknown): string | null {
  if (!isObj(v)) return "expected an object";
  if (typeof v.task_id !== "string") return "task_id must be a string";
  if (typeof v.defense !== "string") return "defense must be a string";
  if (typeof v.model !== "string") return "model must be a string";
  if (!(v.attack_family === null || typeof v.attack_family === "string"))
    return "attack_family must be a string or null";
  if (typeof v.attack_success !== "boolean") return "attack_success must be true/false";
  if (typeof v.task_success !== "boolean") return "task_success must be true/false";
  if (typeof v.blocked !== "number" || v.blocked < 0) return "blocked must be a number ≥ 0";
  return null;
}

/** Field and type checks matching contracts/trace-row.schema.json */
export function validateTraceRow(v: unknown): string | null {
  if (!isObj(v)) return "expected an object";
  if (typeof v.run_id !== "string") return "run_id must be a string";
  if (typeof v.task !== "string") return "task must be a string";
  if (typeof v.defense !== "string") return "defense must be a string";
  if (!(v.family === null || typeof v.family === "string")) return "family must be a string or null";
  if (typeof v.outcome !== "string") return "outcome must be a string";
  if (!Array.isArray(v.steps)) return "steps must be an array";
  for (let i = 0; i < v.steps.length; i++) {
    const s = v.steps[i];
    if (!isObj(s) || typeof s.role !== "string") return `steps[${i}].role must be a string`;
    if (s.flag !== undefined && s.flag !== "attack" && s.flag !== "blocked")
      return `steps[${i}].flag must be "attack" or "blocked"`;
    if (s.call !== undefined && (!isObj(s.call) || typeof s.call.name !== "string"))
      return `steps[${i}].call.name must be a string`;
  }
  return null;
}

export const parseResults = (text: string) => parseJsonl<ResultRow>(text, validateResultRow);
export const parseTraces = (text: string) => parseJsonl<TraceRow>(text, validateTraceRow);
