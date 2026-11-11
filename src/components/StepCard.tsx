import { AlertTriangle, Bot, ShieldCheck, ShieldHalf, User, Wrench } from "lucide-react";

export type StepKind = "user" | "tool" | "agent" | "system";
export type StepState = "attack" | "blocked" | "missed";

export interface StepCardProps {
  kind: StepKind;
  text?: string;
  /** A tool call, shown in mono. */
  code?: string;
  /** Exact injected substring inside `text` (highlighted yellow). */
  inj?: string;
  state?: StepState;
  /** What the attacker wanted (shown on executed attacks). */
  goal?: string;
  /** Why the defense blocked or missed it. */
  reason?: string;
  animate?: boolean;
}

const ROLE: Record<StepKind, { label: string; Icon: typeof User }> = {
  user: { label: "You", Icon: User },
  tool: { label: "Tool result", Icon: Wrench },
  agent: { label: "Agent", Icon: Bot },
  system: { label: "Defense log", Icon: ShieldHalf },
};

/** Renders `text` with the injected span wrapped in a yellow <mark>. */
export function Injected({ text, inj }: { text: string; inj?: string }) {
  if (!inj) return <>{text}</>;
  const i = text.indexOf(inj);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="inj">
        <span className="sr-only">Injected text: </span>
        {inj}
      </mark>
      {text.slice(i + inj.length)}
    </>
  );
}

function Code({ children, struck, onDanger }: { children: string; struck?: boolean; onDanger?: boolean }) {
  return (
    <code
      className={`block whitespace-pre-wrap break-words rounded-control px-3 py-2 font-mono text-code ${
        onDanger
          ? "bg-black/25 text-white"
          : struck
            ? "border border-dashed border-ok text-muted line-through decoration-[1.5px]"
            : "border border-border bg-raised text-ink"
      }`}
    >
      {struck && <span className="sr-only">Blocked call: </span>}
      <span aria-hidden className={onDanger ? "text-white/70" : "text-faint"}>
        →{" "}
      </span>
      {children}
    </code>
  );
}

export function StepCard({ kind, text, code, inj, state, goal, reason, animate }: StepCardProps) {
  const { label, Icon } = ROLE[kind];
  const anim = animate ? "step-in" : "";

  // Attacker action executed: one loud, unmistakable treatment (solid block + icon + label).
  if (state === "attack" || state === "missed") {
    return (
      <div className={`rounded-card bg-danger p-4 text-white ${anim}`} role="group" aria-label="Attack succeeded">
        {/* The one loud label, so an executed attack never reads like a red button. */}
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em]">
          <AlertTriangle size={15} strokeWidth={2.25} aria-hidden />
          Attack succeeded
        </div>
        {state === "missed" && reason && (
          <p className="mt-2 text-sm">
            <span className="font-semibold">This defense missed it:</span> {reason}
          </p>
        )}
        <div className="mt-3">{code ? <Code onDanger>{code}</Code> : text}</div>
        {goal && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">Attacker goal reached:</span> {goal}
          </p>
        )}
        {state === "attack" && reason && <p className="mt-2 text-sm text-white/90">{reason}</p>}
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className={`rounded-card border border-ok bg-ok-soft p-4 ${anim}`} role="group" aria-label="Blocked">
        <div className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-ok-ink">
          <ShieldCheck size={15} strokeWidth={2} aria-hidden />
          Blocked.
        </div>
        <div className="mt-3">{code ? <Code struck>{code}</Code> : <span className="text-muted line-through">{text}</span>}</div>
        {reason && <p className="mt-3 text-sm text-ink">{reason}</p>}
      </div>
    );
  }

  return (
    <div className={`rounded-card border border-border bg-surface ${anim}`}>
      <div className="label flex items-center gap-1.5 border-b border-rule px-4 py-2">
        <Icon size={13} strokeWidth={1.75} aria-hidden />
        {label}
      </div>
      <div className="p-4 text-sm text-ink">
        {code ? (
          <Code>{code}</Code>
        ) : kind === "user" ? (
          <p>“{text}”</p>
        ) : kind === "tool" ? (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-5">
            <Injected text={text ?? ""} inj={inj} />
          </p>
        ) : kind === "system" ? (
          <p className="text-muted">{text}</p>
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}
