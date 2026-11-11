// Typed client for the harness backend.
// VITE_API_URL unset  -> demo mode (bundled data, DEMO badge)
// VITE_API_URL set    -> try the backend; if it is unreachable, fall back to demo data
// "/"                 -> same origin (used by `npm run dev:mock`)
import type { DataSource, ResultRow, RunRequest, RunStatus, TraceRow } from "./types";
import { parseResults, parseTraces, type ParseResult } from "./lib/parseJsonl";
import demoResultsText from "./data/demo-results.jsonl?raw";
import demoTracesText from "./data/demo-traces.jsonl?raw";

const RAW_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";

export const apiConfigured = RAW_URL !== "";
export const apiBase = RAW_URL === "/" ? "" : RAW_URL.replace(/\/+$/, "");
export const apiLabel = RAW_URL === "/" ? window.location.origin : RAW_URL;

const TIMEOUT_MS = 3000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function request(path: string, init?: RequestInit, timeout = TIMEOUT_MS): Promise<Response> {
  if (!apiConfigured) throw new ApiError("Backend URL not set (VITE_API_URL)");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${apiBase}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new ApiError(`${init?.method ?? "GET"} ${path} returned ${res.status}`, res.status);
    return res;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      (e as Error).name === "AbortError" ? `No answer from ${apiLabel} within ${timeout / 1000}s` : `Can’t reach ${apiLabel}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export interface Loaded<T> {
  rows: T[];
  source: DataSource;
  /** Lines that failed validation (contract drift shows up here). */
  errors: ParseResult<T>["errors"];
  /** Why we fell back to demo data, if we did. */
  fallbackReason?: string;
}

export function demoResults(): Loaded<ResultRow> {
  const { rows, errors } = parseResults(demoResultsText);
  return { rows, errors, source: "DEMO" };
}

export function demoTraces(): Loaded<TraceRow> {
  const { rows, errors } = parseTraces(demoTracesText);
  return { rows, errors, source: "DEMO" };
}

/** GET /api/results -> JSONL of ResultRow */
export async function getResults(): Promise<Loaded<ResultRow>> {
  if (!apiConfigured) return demoResults();
  try {
    const res = await request("/api/results");
    const { rows, errors } = parseResults(await res.text());
    return { rows, errors, source: "LIVE" };
  } catch (e) {
    return { ...demoResults(), fallbackReason: (e as Error).message };
  }
}

/**
 * GET /api/traces/{id} -> JSONL of TraceRow.
 * `id` is a batch run id from POST /api/run. With no id we ask for "latest"
 * (the backend should alias it to its most recent run).
 */
export async function getTraces(id = "latest"): Promise<Loaded<TraceRow>> {
  if (!apiConfigured) return demoTraces();
  try {
    const res = await request(`/api/traces/${encodeURIComponent(id)}`);
    const { rows, errors } = parseTraces(await res.text());
    return { rows, errors, source: "LIVE" };
  } catch (e) {
    return { ...demoTraces(), fallbackReason: (e as Error).message };
  }
}

/** POST /api/run -> { run_id } */
export async function startRun(body: RunRequest): Promise<{ run_id: string }> {
  const res = await request(
    "/api/run",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    10000,
  );
  const json = await res.json();
  if (typeof json?.run_id !== "string") throw new ApiError("POST /api/run did not return a run_id");
  return json;
}

/** GET /api/runs/{id}/status -> { done, total } */
export async function getRunStatus(id: string): Promise<RunStatus> {
  const res = await request(`/api/runs/${encodeURIComponent(id)}/status`);
  const json = await res.json();
  if (typeof json?.done !== "number" || typeof json?.total !== "number")
    throw new ApiError("Status response must be { done: number, total: number }");
  return json;
}

export type BackendState = "not-configured" | "checking" | "online" | "offline";

/** Reachability check using the results endpoint (no extra endpoint in the contract). */
export async function pingBackend(): Promise<BackendState> {
  if (!apiConfigured) return "not-configured";
  try {
    await request("/api/results", { method: "GET" });
    return "online";
  } catch {
    return "offline";
  }
}
