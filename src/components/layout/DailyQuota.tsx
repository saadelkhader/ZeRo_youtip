"use client";

import { Progress } from "@/components/ui/progress";
import { formatDailyQuota, progressRatio } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

interface DailyQuotaProps {
  listenedSeconds: number;
  limitMinutes: number;
  className?: string;
}

/**
 * Compact daily-listening quota: a thin progress bar plus an
 * "X min / Y min aujourd'hui" label. Bar turns warning/error as the
 * limit is approached — calm, never alarmist.
 */
export function DailyQuota({
  listenedSeconds,
  limitMinutes,
  className,
}: DailyQuotaProps) {
  const limitSeconds = limitMinutes * 60;
  const ratio = progressRatio(listenedSeconds, limitSeconds);
  const pct = Math.round(ratio * 100);

  const indicator =
    ratio >= 1
      ? "bg-error"
      : ratio >= 0.85
        ? "bg-warning"
        : "bg-accent";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Progress value={pct} indicatorClassName={indicator} className="h-1" />
      <p className="text-xs text-text-tertiary">
        <span className="font-mono nums-tabular text-text-secondary">
          {formatDailyQuota(listenedSeconds, limitMinutes)}
        </span>{" "}
        aujourd&apos;hui
      </p>
    </div>
  );
}
