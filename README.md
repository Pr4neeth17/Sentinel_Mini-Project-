# PI Harness Console

A web console that shows how tool-using AI agents get attacked by **indirect prompt injection**, and how five defenses
(delimiting, data/instruction separation, output validation, provenance tagging, a calibrated input filter) block it.

Front end only: React 18 + Vite + TypeScript + Tailwind + React Router (hash routes) + Recharts.
Everything runs offline from bundled demo data; a typed API layer (`src/api.ts`) plugs into the backend when it exists.

## Run it

**No `.env` file, API key, account or backend is needed.** The console ships with demo data and runs fully offline.

### 1. Install the prerequisites

- [Node.js](https://nodejs.org) **18 or newer** (20 LTS recommended). Check with `node --version`.
- [Git](https://git-scm.com).

### 2. Get the code and install

```bash
git clone https://github.com/Pr4neeth17/Sentinel_Mini-Project-.git
cd Sentinel_Mini-Project-
npm install
```

### 3. Start the console

```bash
npm run dev
```

Open **http://localhost:5173**. The badge in the top-right says **DEMO**: everything you see comes from the bundled demo data.

### Other commands

```bash
npm run dev:mock     # starts a built-in mock backend: LIVE badge, Lab runs work (still no .env needed)
npm test             # unit tests for stats (Wilson interval, aggregation) and JSONL parsing
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build locally
npm run gen:demo     # regenerate the demo data (seeded, reproducible)
```

### Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm` is not recognised | Install Node.js, then open a new terminal. |
| Port 5173 is already in use | Vite picks the next free port; use the URL it prints. |
| Blank page after pulling new code | Stop the server, run `npm install` again, then `npm run dev`. |
| Want the dark theme | Use the moon icon in the header. |

## Pages

| Route | Page | What it answers |
| --- | --- | --- |
| `#/` | Attack demos | What does an injection attack look like, and does defense X stop it? |
| `#/overview` | Overview | The problem in one line, how attacks work, headline numbers. |
| `#/defenses` | Defenses | What each defense does, where it fails, what it costs. |
| `#/results` | Results | Leaderboard, attack success with 95% CIs, security vs utility, ablation. |
| `#/traces` | Trace viewer | Step-by-step recorded runs. |
| `#/method` | Method | Threat model, architecture, metric formulas, datasets, limitations. |
| `#/lab` | Lab | Start runs on the backend, load `results.jsonl` / `traces.jsonl`. |

## Colour meaning (fixed)

| Colour | Meaning |
| --- | --- |
| Solid red block + warning icon + “ATTACK SUCCEEDED” | An attacker action was executed |
| Green | A defense blocked it |
| Yellow highlight | Injected text |
| Brand red (buttons, links, active tab, main chart series) | Interface |
| Greys | Neutral UI |

> Change from the original spec: the brand colour is red (light: white + red, dark: black + red), so “neutral UI” is grey
> instead of blue, and an executed attack is always a **solid red block with an icon and a label** so it can’t be
> confused with a red button.

## Data contracts

Unchanged from the spec. Full details, examples and JSON Schemas: [`docs/backend-contract.md`](docs/backend-contract.md), [`contracts/`](contracts).

**Result row** (one per line in `results.jsonl`)

```ts
{ task_id: string, defense: string, model: string, attack_family: string | null,
  attack_success: boolean, task_success: boolean, blocked: number }
```

`attack_family: null` = benign run. **BU** = task_success rate on benign rows; **UA** = task_success rate on attack rows;
**ASR** = attack_success rate on attack rows; **CI** = Wilson 95%.

**Trace row** (one per line in `traces.jsonl`)

```ts
{ run_id, task, defense, family, outcome,
  steps: [{ role, text?, call?: { name, args }, inj?, flag?: "attack" | "blocked", note? }] }
```

**Endpoints**

```
POST /api/run              {model, defenses[], families[], reps, seed} -> {run_id}
GET  /api/runs/{id}/status -> {done, total}
GET  /api/results          -> JSONL
GET  /api/traces/{id}      -> JSONL
```

One addition to tell the backend team about: on load, the console asks for `GET /api/traces/latest`, so the backend should
alias `latest` to its most recent run.

**Scenarios** for the Attack demos page live in `src/data/scenarios.json`:

```ts
{ id, icon, name, sub, task,
  steps: [{ t: "user" | "tool" | "agent", x: string, inj?: string, a?: 1, goal?: string }],
  def: { D1_delimit: [0|1, why], D2_separate: [...], D3_validate: [...], D4_provenance: [...], D5_filter: [...] } }
```

`1` = the defense blocks the step marked `a: 1`. “Layered” is computed: it blocks if any of D5 → D2 → D4 → D3 blocks, and says
which layer caught it. Icons: `mail`, `shopping-cart`, `terminal`, `headset` (add more in `src/pages/AttackDemos.tsx`).

## Swap demo data for the real backend

1. Make the backend serve the four endpoints above (check its output against `contracts/*.schema.json`).
2. Allow CORS from `http://localhost:5173`.
3. Start the console with the backend's address. No file is needed; pass it for this one run:
   ```bash
   # macOS / Linux / Git Bash
   VITE_API_URL=http://localhost:8000 npm run dev
   ```
   ```powershell
   # Windows PowerShell
   $env:VITE_API_URL="http://localhost:8000"; npm run dev
   ```
   (You can also put that line in a local `.env.local`. All `.env*` files are git-ignored, so keep any private URLs there and never commit them.)
4. The badge switches to **LIVE**. If the backend is down, the console falls back to demo data, shows
   **DEMO** and an “offline” banner with a Retry button — it never shows demo numbers without the badge.
5. No backend yet? Run the harness offline, then load its `results.jsonl` and `traces.jsonl` in **Lab → Load files**.
   The badge switches to **FROM FILE**. “Back to demo data” undoes it.

To try the full LIVE flow before the backend exists, run `npm run dev:mock` (see `mock/mockApi.ts`).

## Project layout

```
src/
  api.ts                 typed client, demo fallback
  types.ts               data contracts
  context/DataContext    results + traces + source (DEMO / LIVE / FROM FILE)
  lib/stats.ts           wilson(), aggregate(), asrMatrix()
  lib/parseJsonl.ts      JSONL parser + contract validation
  lib/defenses.ts        defense ids, names, descriptions
  pages/                 one file per page
  components/            StepCard, DefenseChips, Leaderboard, AsrBars, TradeoffScatter, TraceList, Kpi, Badge, Banner, EmptyState, …
  data/                  scenarios.json, demo-results.jsonl, demo-traces.jsonl
contracts/               JSON Schemas for the backend
docs/backend-contract.md
mock/mockApi.ts          dev-only mock backend
scripts/gen-demo.mjs     demo data generator
```

## Sample content to replace

- All numbers in `src/data/demo-*.jsonl` are illustrative. The UI labels them DEMO everywhere.
