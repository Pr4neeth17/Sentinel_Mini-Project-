// Data contracts shared with the backend. Do not change field names without
// updating contracts/*.schema.json and docs/backend-contract.md.

/** One evaluated run. attack_family === null means a benign (no-attack) run. */
export interface ResultRow {
  task_id: string;
  defense: string;
  model: string;
  attack_family: string | null;
  attack_success: boolean;
  task_success: boolean;
  /** Number of tool calls / inputs the defense stopped in this run. */
  blocked: number;
}

export interface TraceStep {
  role: string; // "user" | "agent" | "tool" | "system" (open set)
  text?: string;
  call?: { name: string; args: Record<string, unknown> };
  /** Exact injected substring inside `text`, highlighted in the UI. */
  inj?: string;
  flag?: "attack" | "blocked";
  note?: string;
}

export interface TraceRow {
  run_id: string;
  task: string;
  defense: string;
  family: string | null;
  outcome: string; // "attack_succeeded" | "blocked" | "benign_ok" | "task_failed" (open set)
  steps: TraceStep[];
}

export interface RunRequest {
  model: string;
  defenses: string[];
  families: string[];
  reps: number;
  seed: number;
}

export interface RunStatus {
  done: number;
  total: number;
}

/** Attack demo scenarios (src/data/scenarios.json). Front-end only. */
export interface ScenarioStep {
  t: "user" | "tool" | "agent";
  x: string;
  inj?: string;
  a?: 1;
  goal?: string;
}

export type DefenseVerdict = [0 | 1, string];

export interface Scenario {
  id: string;
  icon: string;
  name: string;
  sub: string;
  task: string;
  steps: ScenarioStep[];
  def: {
    D1_delimit: DefenseVerdict;
    D2_separate: DefenseVerdict;
    D3_validate: DefenseVerdict;
    D4_provenance: DefenseVerdict;
    D5_filter: DefenseVerdict;
  };
}

export type DataSource = "DEMO" | "LIVE" | "FROM FILE";
