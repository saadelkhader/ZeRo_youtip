import { cn } from "@/lib/utils/cn";

/** Subtle pulsing placeholder. Respects prefers-reduced-motion (see globals). */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-pulse rounded-md bg-surface-secondary/60",
        className,
      )}
      {...props}
    />
  );
}

/** Queue / video list rows. */
export function VideoListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border-light bg-surface-card p-3"
        >
          <Skeleton className="h-[45px] w-[60px] shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Notes list cards. */
export function NoteListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg border border-border-light bg-surface-card p-4"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Stat cards grid. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg border border-border-light bg-surface-card p-4"
        >
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
