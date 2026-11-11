import type { ReactNode } from "react";

/** Keeps the block's frame and says what to do next, in one or two sentences. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-control border border-dashed border-control px-4 py-5 text-sm">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="text-muted">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
