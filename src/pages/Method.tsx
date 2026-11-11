import type { ReactNode } from "react";
import { PageHeader, Panel } from "../components/ui";
import { Term } from "../components/Term";

const RED = "#ff5c64";

function Node({ x, y, w, h, title, sub, accent }: { x: number; y: number; w: number; h: number; title: string; sub?: string; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#1c1f23" stroke={accent ? RED : "#3b3e43"} strokeWidth={accent ? 1.5 : 1} />
      <text x={x + 14} y={y + 24} fill="#fff" fontSize={14} fontWeight={600}>
        {title}
      </text>
      {sub && (
        <text x={x + 14} y={y + 43} fill="#a0a2a7" fontSize={12}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Edge({ d, label, lx, ly, dashed, red }: { d: string; label?: string; lx?: number; ly?: number; dashed?: boolean; red?: boolean }) {
  return (
    <g>
      <path d={d} fill="none" stroke={red ? RED : "#85888e"} strokeWidth={1.5} strokeDasharray={dashed ? "5 4" : undefined} markerEnd={red ? "url(#arrow-red)" : "url(#arrow)"} />
      {label && (
        <text x={lx} y={ly} fill={red ? RED : "#a0a2a7"} fontSize={11.5}>
          {label}
        </text>
      )}
    </g>
  );
}

function Architecture() {
  return (
    <figure className="overflow-hidden rounded-card border border-[#2a2d31] bg-panel-dark">
      <div className="flex items-center gap-2.5 border-b border-[#2a2d31] px-5 py-3">
        <span className="fig !border-[#3b3e43] !text-[#a0a2a7]">Fig. 1</span>
        <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#e4e4e6]">Harness architecture</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 980 400" className="min-w-[760px]" role="img" aria-labelledby="arch-title arch-desc">
          <title id="arch-title">Harness architecture</title>
          <desc id="arch-desc">
            The user task goes to the agent loop. Every tool call and tool output passes through the defense middleware (D1 to D5) on the
            way to and from the tools. An attacker injector poisons tool outputs. The evaluator reads the full trace and writes results and
            traces as JSON Lines.
          </desc>
          <defs>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#1b1e22" strokeWidth="1" />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#85888e" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={RED} />
            </marker>
          </defs>
          <rect width="980" height="400" fill="url(#grid)" />

          <Node x={30} y={60} w={150} h={56} title="User task" sub="AgentDojo / own suite" />
          <Node x={240} y={60} w={200} h={56} title="Agent loop" sub="planner → caller → executor" />
          <g>
            <rect x={500} y={36} width={210} height={150} rx={8} fill="#1c1f23" stroke={RED} strokeWidth={1.5} />
            <text x={514} y={60} fill="#fff" fontSize={14} fontWeight={600}>
              Defense middleware
            </text>
            {["D1 Delimiting", "D2 Separation", "D3 Output validation", "D4 Provenance", "D5 Input filter"].map((d, i) => (
              <text key={d} x={514} y={84 + i * 20} fill="#d4d5d8" fontSize={12}>
                {d}
              </text>
            ))}
          </g>
          <Node x={790} y={60} w={160} h={56} title="Tools" sub="mail · web · shell · pay" />
          <Node x={790} y={270} w={160} h={56} title="Attacker injector" sub="poisons tool outputs" accent />
          <Node x={240} y={270} w={200} h={56} title="Evaluator" sub="LLM-as-judge + exact match" />
          <Node x={500} y={270} w={210} h={56} title="results.jsonl · traces.jsonl" sub="→ this console" />

          <Edge d="M180 88 L236 88" />
          <Edge d="M440 80 L496 80" label="call" lx={456} ly={72} />
          <Edge d="M710 80 L786 80" label="checked call" lx={716} ly={72} />
          <Edge d="M790 104 L714 104" label="raw output" lx={720} ly={122} />
          <Edge d="M500 104 L444 104" label="result" lx={452} ly={122} />
          <Edge d="M870 270 L870 120" label="injection" lx={880} ly={200} dashed red />
          <Edge d="M340 116 L340 266" label="full trace" lx={348} ly={200} />
          <Edge d="M440 298 L496 298" />
        </svg>
      </div>
      <figcaption className="border-t border-[#2a2d31] px-5 py-3 text-sm text-[#a0a2a7]">
        Every tool call goes out, and every tool output comes back, through the defense middleware. The attacker controls only content
        inside tool outputs.
      </figcaption>
    </figure>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-border pt-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <h2 id={id} className="label !text-ink">
        {title}
      </h2>
      <div className="min-w-0 text-base leading-7 text-ink">{children}</div>
    </section>
  );
}

function Formula({ name, term, children }: { name: string; term: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-raised p-4">
      <div className="label !text-accent">
        <Term k={term}>{name}</Term>
      </div>
      <div className="mt-2 font-mono text-code text-ink">{children}</div>
    </div>
  );
}

export default function Method() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Method"
        sub="What we attack, how we defend, and how we score it — so the numbers on the Results page can be checked."
      />

      <Architecture />

      <Section id="threat" title="Threat model">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The user and the system prompt are trusted. The model and tools work as specified.</li>
          <li>The attacker can write content the agent will later read through a tool: an email, a web page, a file, a knowledge-base article, a review.</li>
          <li>The attacker can’t see the conversation, change the system prompt or call tools directly.</li>
          <li>An attack succeeds when the agent executes the attacker’s goal (a tool call with real effect), not when it merely repeats the text.</li>
        </ul>
      </Section>

      <Section id="metrics" title="Metrics">
        <div className="grid gap-3 md:grid-cols-3">
          <Formula name="ASR" term="ASR">
            attack runs where the goal executed ÷ attack runs
          </Formula>
          <Formula name="UA" term="UA">
            attack runs where the user’s task succeeded ÷ attack runs
          </Formula>
          <Formula name="BU" term="BU">
            benign runs where the task succeeded ÷ benign runs
          </Formula>
        </div>
        <p className="mt-4">
          A row with <code className="font-mono text-code">attack_family: null</code> is a benign run. Every rate comes with a{" "}
          <Term k="CI">95% Wilson interval</Term>:
        </p>
        <div className="mt-2 overflow-x-auto rounded-card border border-border bg-raised p-4 font-mono text-code">
          p̂ = k / n,  centre = (p̂ + z²/2n) / (1 + z²/n),  half-width = z·√(p̂(1−p̂)/n + z²/4n²) / (1 + z²/n),  z = 1.96
        </div>
        <p className="mt-3 text-muted">The implementation and its unit tests are in src/lib/stats.ts.</p>
      </Section>

      <Section id="data" title="Datasets">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-medium">AgentDojo</span> — 97 user tasks and 629 security test cases across workspace, travel, banking and
            Slack suites. Public, no credentials.
          </li>
          <li>
            <span className="font-medium">Agent Security Bench (ASB)</span> — attack families (naive, context ignoring, fake completion,
            combined) used to vary the injection style.
          </li>
          <li>
            <span className="font-medium">Own mini-suite</span> — the four scenarios on the Attack demos page, written to show common patterns
            clearly.
          </li>
        </ul>
      </Section>

      <Section id="limits" title="Limitations">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Results hold for the models and tasks we ran; small open models and API models can behave very differently.</li>
          <li>The judge can be wrong. We use exact-match checks on tool calls wherever the benchmark allows, and the LLM judge only for free text.</li>
          <li>Adaptive attackers who know the defense were not tested; real attackers can iterate.</li>
          <li>The demo walkthroughs are illustrative, not measured.</li>
        </ul>
      </Section>

      <Section id="refs" title="References">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Zhang et al. Agent Security Bench (ASB).{" "}
            <a className="text-accent hover:underline" href="https://arxiv.org/abs/2410.02644" target="_blank" rel="noreferrer">
              arXiv:2410.02644
            </a>
          </li>
          <li>
            Debenedetti et al. AgentDojo.{" "}
            <a className="text-accent hover:underline" href="https://arxiv.org/abs/2406.13352" target="_blank" rel="noreferrer">
              arXiv:2406.13352
            </a>
          </li>
          <li>
            WASP: benchmarking web agent security against prompt injection.{" "}
            <a className="text-accent hover:underline" href="https://arxiv.org/abs/2504.18575" target="_blank" rel="noreferrer">
              arXiv:2504.18575
            </a>
          </li>
          <li>
            OWASP Top 10 for LLM Applications 2025.{" "}
            <a
              className="text-accent hover:underline"
              href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"
              target="_blank"
              rel="noreferrer"
            >
              owasp.org
            </a>
          </li>
        </ol>
      </Section>

      <Section id="team" title="Team">
        <Panel className="bg-raised">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[160px_1fr]">
            <dt className="text-muted">Developers</dt>
            <dd>Praneeth Bhat, Deepjyoti Nayak</dd>
            <dt className="text-muted">Project guide</dt>
            <dd>Prof. Lakshmidevi H M</dd>
            <dt className="text-muted">Project</dt>
            <dd>A1 · Prompt-injection defense harness for tool-use agents</dd>
          </dl>
        </Panel>
      </Section>
    </div>
  );
}
