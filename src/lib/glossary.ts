export const GLOSSARY: Record<string, { term: string; def: string }> = {
  ASR: {
    term: "Attack success rate",
    def: "Share of attack runs where the attacker’s goal was carried out (e.g. the mail was really forwarded). Lower is better.",
  },
  UA: {
    term: "Utility under attack",
    def: "Share of attack runs where the agent still finished the user’s real task. Higher is better.",
  },
  BU: {
    term: "Benign utility",
    def: "Share of runs with no attack where the agent finished the task. Shows what a defense costs on normal work.",
  },
  CI: {
    term: "95% confidence interval",
    def: "The range the true rate likely falls in, given how many runs we have. We use the Wilson interval, which behaves well near 0% and 100%.",
  },
  n: {
    term: "n",
    def: "Number of runs behind a figure. Small n means a wide interval.",
  },
  provenance: {
    term: "Provenance",
    def: "Where a piece of text came from: the user, a tool, or a web page. Defense D4 tracks it for every argument.",
  },
  quarantine: {
    term: "Quarantine",
    def: "Running untrusted text through a model that has no tools, so instructions hidden in it can’t trigger actions (defense D2).",
  },
  injection: {
    term: "Indirect prompt injection",
    def: "Instructions hidden in content the agent reads — an email, a web page, a README — that the agent then follows as if the user had asked.",
  },
};
