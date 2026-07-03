// ─────────────────────────────────────────────────────────────
// Time / duration formatting helpers
// ─────────────────────────────────────────────────────────────

/**
 * Player timestamp. Pads to "HH:MM:SS" when there's an hour or more, otherwise
 * "MM:SS" (e.g. "01:23:45", "12:43").
 */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Compact human duration: "1h 23min", "45min", "2h". Seconds under a minute
 * round up to "1min" so a video never reads as "0min".
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return s > 0 ? "1min" : "0min";
}

/** Minutes (rounded) from seconds, used for daily-limit displays. */
export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

/** "12 min / 90 min" style label for the daily quota. */
export function formatDailyQuota(
  listenedSeconds: number,
  limitMinutes: number,
): string {
  return `${secondsToMinutes(listenedSeconds)} min / ${limitMinutes} min`;
}

/** Clamp a 0..1 progress ratio. */
export function progressRatio(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, value / total));
}
