import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DataSource, ResultRow, TraceRow } from "../types";
import { apiConfigured, demoResults, demoTraces, getResults, getTraces, type BackendState } from "../api";
import { parseResults, parseTraces } from "../lib/parseJsonl";

type Status = "loading" | "ready" | "error";

interface DataState {
  results: ResultRow[];
  traces: TraceRow[];
  resultsSource: DataSource;
  tracesSource: DataSource;
  /** What the header badge shows: FROM FILE if either set came from a file, else LIVE/DEMO. */
  source: DataSource;
  status: Status;
  error: string | null;
  backend: BackendState;
  fallbackReason: string | null;
  /** Rows dropped by validation on the last load. */
  rejected: number;
  reload: () => Promise<void>;
  loadResultsFile: (text: string, name: string) => FileLoadReport;
  loadTracesFile: (text: string, name: string) => FileLoadReport;
  resetToDemo: () => void;
  fileNames: { results?: string; traces?: string };
}

export interface FileLoadReport {
  ok: boolean;
  loaded: number;
  errors: { line: number; message: string }[];
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [resultsSource, setResultsSource] = useState<DataSource>("DEMO");
  const [tracesSource, setTracesSource] = useState<DataSource>("DEMO");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<BackendState>(apiConfigured ? "checking" : "not-configured");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [rejected, setRejected] = useState(0);
  const [fileNames, setFileNames] = useState<{ results?: string; traces?: string }>({});

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [r, t] = await Promise.all([getResults(), getTraces()]);
      setResults(r.rows);
      setTraces(t.rows);
      setResultsSource(r.source);
      setTracesSource(t.source);
      setRejected(r.errors.length + t.errors.length);
      const reason = r.fallbackReason ?? t.fallbackReason ?? null;
      setFallbackReason(reason);
      setBackend(!apiConfigured ? "not-configured" : r.source === "LIVE" ? "online" : "offline");
      setFileNames({});
      setStatus("ready");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadResultsFile = useCallback((text: string, name: string): FileLoadReport => {
    const { rows, errors } = parseResults(text);
    if (rows.length === 0) return { ok: false, loaded: 0, errors };
    setResults(rows);
    setResultsSource("FROM FILE");
    setFileNames((f) => ({ ...f, results: name }));
    return { ok: true, loaded: rows.length, errors };
  }, []);

  const loadTracesFile = useCallback((text: string, name: string): FileLoadReport => {
    const { rows, errors } = parseTraces(text);
    if (rows.length === 0) return { ok: false, loaded: 0, errors };
    setTraces(rows);
    setTracesSource("FROM FILE");
    setFileNames((f) => ({ ...f, traces: name }));
    return { ok: true, loaded: rows.length, errors };
  }, []);

  const resetToDemo = useCallback(() => {
    const r = demoResults();
    const t = demoTraces();
    setResults(r.rows);
    setTraces(t.rows);
    setResultsSource("DEMO");
    setTracesSource("DEMO");
    setFileNames({});
    setStatus("ready");
  }, []);

  const source: DataSource =
    resultsSource === "FROM FILE" || tracesSource === "FROM FILE"
      ? "FROM FILE"
      : resultsSource === "LIVE"
        ? "LIVE"
        : "DEMO";

  const value = useMemo<DataState>(
    () => ({
      results,
      traces,
      resultsSource,
      tracesSource,
      source,
      status,
      error,
      backend,
      fallbackReason,
      rejected,
      reload,
      loadResultsFile,
      loadTracesFile,
      resetToDemo,
      fileNames,
    }),
    [results, traces, resultsSource, tracesSource, source, status, error, backend, fallbackReason, rejected, reload, loadResultsFile, loadTracesFile, resetToDemo, fileNames],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData must be used inside <DataProvider>");
  return v;
}
