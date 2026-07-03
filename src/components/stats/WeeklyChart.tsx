"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { DayBucket } from "@/lib/actions/stats";
import { formatDuration } from "@/lib/utils/time";

interface WeeklyChartProps {
  days: DayBucket[];
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value?: number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const seconds = payload[0]?.value ?? 0;
  return (
    <div className="rounded-md border border-border-light bg-surface-card px-3 py-2 shadow-elevated">
      <p className="text-xs font-medium text-text-primary">{label}</p>
      <p className="font-mono text-xs text-text-secondary nums-tabular">
        {formatDuration(seconds)}
      </p>
    </div>
  );
}

/** Simple 7-day listening bars with last-week ghost bars behind. */
export function WeeklyChart({ days }: WeeklyChartProps) {
  const data = days.map((d) => ({
    label: d.label,
    seconds: d.seconds,
    lastWeek: d.lastWeekSeconds,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barGap={-12} margin={{ top: 8, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-secondary)", opacity: 0.5 }}
          content={<ChartTooltip />}
        />
        {/* Ghost bars = last week, behind */}
        <Bar
          dataKey="lastWeek"
          fill="var(--border-strong)"
          radius={[4, 4, 0, 0]}
          barSize={18}
          isAnimationActive={false}
        />
        {/* This week */}
        <Bar
          dataKey="seconds"
          fill="var(--accent)"
          radius={[4, 4, 0, 0]}
          barSize={18}
          animationDuration={400}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
