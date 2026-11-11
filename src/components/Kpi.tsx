import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";

/** One cell of a KPI strip: mono label over a large light value, sub line in grey. */
export function Kpi({ label, value, sub, loading }: { label: ReactNode; value: ReactNode; sub?: ReactNode; loading?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-5 py-5">
      <div className="label">{label}</div>
      {loading ? (
        <Skeleton className="my-1 h-8 w-24" />
      ) : (
        <div className="num truncate text-[30px] font-light leading-9 tracking-[-0.02em] text-ink">{value}</div>
      )}
      {sub && <div className="num text-xs text-muted">{loading ? <Skeleton className="h-3 w-32" /> : sub}</div>}
    </div>
  );
}

/** One container split by 1px dividers. 2 columns on phones, n on desktop. */
export function KpiStrip({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  const lg = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
  return (
    <div
      className={`grid grid-cols-2 overflow-hidden rounded-card border border-border bg-surface ${lg} [&>*]:border-border [&>*]:border-b [&>*:nth-child(odd)]:border-r lg:[&>*]:border-b-0 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0`}
    >
      {children}
    </div>
  );
}
