import { Info, WifiOff, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Kind = "notice" | "offline" | "error";

const ICONS = { notice: Info, offline: WifiOff, error: CircleAlert };

/** Neutral notice strip. Deliberately not red/green/yellow: those colours are reserved. */
export function Banner({ kind = "notice", children, action }: { kind?: Kind; children: ReactNode; action?: ReactNode }) {
  const Icon = ICONS[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-card border border-dashed border-control px-4 py-3 text-sm text-ink"
    >
      <Icon aria-hidden size={15} className="mt-0.5 flex-none text-muted" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}
