// Canonical defense ids used in results data, traces and scenarios.
export const DEFENSE_ORDER = [
  "none",
  "D1_delimit",
  "D2_separate",
  "D3_validate",
  "D4_provenance",
  "D5_filter",
  "layered",
];

export interface DefenseMeta {
  id: string;
  short: string;
  name: string;
  idea: string;
  how: string;
  fails: string;
}

export const DEFENSES: DefenseMeta[] = [
  {
    id: "D1_delimit",
    short: "D1",
    name: "Delimiting",
    idea: "Wrap every tool output in clear markers and tell the model that text inside them is data.",
    how: "Tool results are wrapped in random boundary tags (spotlighting) before they reach the model. The system prompt says that nothing between the tags is an instruction.",
    fails: "It only describes a boundary; it doesn’t enforce one. A persuasive instruction inside the tags is still read, and often still obeyed.",
  },
  {
    id: "D2_separate",
    short: "D2",
    name: "Data/instruction separation",
    idea: "The model that plans actions never reads untrusted text; a tool-less reader does.",
    how: "A planner sees only the user’s request and returns tool calls. Untrusted content goes to a quarantined reader that can extract fields but cannot call tools.",
    fails: "Tasks that genuinely need the planner to act on content (e.g. “do what the email asks”) lose utility, and extracted fields can still carry a payload.",
  },
  {
    id: "D3_validate",
    short: "D3",
    name: "Output validation",
    idea: "Check every proposed tool call against the user’s task before it runs.",
    how: "Each call is checked against a per-task policy: allowed tools, allowed recipients and domains, value limits. Calls that break it are dropped and logged.",
    fails: "Policies must be written per tool; an attack that stays inside the allowed actions (e.g. a wrong but in-policy reply) passes.",
  },
  {
    id: "D4_provenance",
    short: "D4",
    name: "Provenance tagging",
    idea: "Track where every argument came from, and refuse sensitive calls driven by untrusted sources.",
    how: "Each token span carries a source label (user, tool:<name>, web). A sensitive call whose arguments trace back to an untrusted source needs the user’s confirmation.",
    fails: "Label tracking is approximate once the model paraphrases; mixed-source arguments are hard to attribute and can cause false blocks.",
  },
  {
    id: "D5_filter",
    short: "D5",
    name: "Calibrated input filter",
    idea: "Score each tool output for injection, and strip it above a calibrated threshold.",
    how: "A small classifier scores retrieved text. Scores are isotonic-calibrated so the threshold means a real probability; uncertain cases are flagged for abstention.",
    fails: "Paraphrased or polite injections with no trigger words score low and get through; a stricter threshold costs benign utility.",
  },
];

export const LAYERED: DefenseMeta = {
  id: "layered",
  short: "Layered",
  name: "Layered (D2 + D3 + D4 + D5)",
  idea: "Stack the defenses so one miss doesn’t become an executed attack.",
  how: "Runs the filter, the separation, provenance checks and output validation in sequence.",
  fails: "Costs the most utility and latency; every layer’s false positives add up.",
};

const LABELS: Record<string, string> = {
  none: "No defense",
  layered: "Layered",
  ...Object.fromEntries(DEFENSES.map((d) => [d.id, `${d.short} ${d.name}`])),
};

const SHORT: Record<string, string> = {
  none: "None",
  layered: "Layered",
  ...Object.fromEntries(DEFENSES.map((d) => [d.id, d.short])),
};

export function defenseLabel(id: string) {
  return LABELS[id] ?? id;
}

export function defenseShort(id: string) {
  return SHORT[id] ?? id;
}

const FAMILY_LABELS: Record<string, string> = {
  naive: "Naive instruction",
  context_ignore: "Context ignoring",
  fake_completion: "Fake completion",
  combined: "Combined",
};

export function familyLabel(id: string | null) {
  if (id === null) return "Benign";
  return FAMILY_LABELS[id] ?? id.replace(/_/g, " ");
}

const OUTCOME_LABELS: Record<string, string> = {
  attack_succeeded: "Attack succeeded",
  blocked: "Blocked",
  benign_ok: "Task completed",
  task_failed: "Task failed",
};

export function outcomeLabel(id: string) {
  return OUTCOME_LABELS[id] ?? id.replace(/_/g, " ");
}
