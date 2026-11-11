/** Flat grey bar at the real size of the value it stands in for. No shimmer. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block rounded bg-active ${className}`} />;
}

export function SkeletonRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
