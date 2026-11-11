// Dev-only mock of the harness backend, used by `npm run dev:mock`.
// Implements the 4 contract endpoints from the bundled demo data so LIVE mode,
// the badge switch and the Lab progress bar can be tested before the real backend exists.
import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface MockRun {
  started: number;
  total: number;
}

export function mockApi(): Plugin {
  const runs = new Map<string, MockRun>();
  let counter = 0;
  const dataFile = (name: string) => readFileSync(resolve(__dirname, "../src/data", name), "utf8");

  return {
    name: "pi-harness-mock-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const send = (status: number, body: string, type = "application/json") => {
          res.statusCode = status;
          res.setHeader("Content-Type", type);
          res.end(body);
        };

        // GET /api/results -> JSONL
        if (req.method === "GET" && url.pathname === "/api/results") {
          return send(200, dataFile("demo-results.jsonl"), "application/x-ndjson");
        }

        // GET /api/traces/{id} -> JSONL ("latest" or any run id returns the demo traces)
        if (req.method === "GET" && /^\/api\/traces\/[^/]+$/.test(url.pathname)) {
          return send(200, dataFile("demo-traces.jsonl"), "application/x-ndjson");
        }

        // POST /api/run -> { run_id }
        if (req.method === "POST" && url.pathname === "/api/run") {
          let raw = "";
          for await (const chunk of req) raw += chunk;
          let body: { defenses?: unknown[]; families?: unknown[]; reps?: number };
          try {
            body = JSON.parse(raw || "{}");
          } catch {
            return send(400, JSON.stringify({ error: "body must be JSON" }));
          }
          const defenses = Array.isArray(body.defenses) ? body.defenses.length : 0;
          const families = Array.isArray(body.families) ? body.families.length : 0;
          if (!defenses || !families) return send(422, JSON.stringify({ error: "pick at least one defense and one family" }));
          const reps = Math.max(1, Math.min(50, Number(body.reps) || 1));
          const run_id = `run_${String(++counter).padStart(4, "0")}`;
          runs.set(run_id, { started: Date.now(), total: defenses * families * reps * 25 });
          return send(200, JSON.stringify({ run_id }));
        }

        // GET /api/runs/{id}/status -> { done, total }
        const m = url.pathname.match(/^\/api\/runs\/([^/]+)\/status$/);
        if (req.method === "GET" && m) {
          const run = runs.get(m[1]);
          if (!run) return send(404, JSON.stringify({ error: "unknown run" }));
          // Finishes in about 8 seconds whatever the size.
          const frac = Math.min(1, (Date.now() - run.started) / 8000);
          return send(200, JSON.stringify({ done: Math.round(run.total * frac), total: run.total }));
        }

        return send(404, JSON.stringify({ error: "not found" }));
      });
    },
  };
}
