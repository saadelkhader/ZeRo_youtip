"use client";

import * as React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  MoonStar,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePlayerStore, type PlaybackRate } from "@/lib/stores/playerStore";
import { formatTimestamp, progressRatio } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

const RATES: PlaybackRate[] = [1, 1.25, 1.5, 2];

interface PlayerControlsProps {
  onSeekTo: (seconds: number) => void;
  onSeekBy: (delta: number) => void;
  onSetRate: (rate: PlaybackRate) => void;
  singleVideoMode: boolean;
  onToggleSingleVideo: (value: boolean) => void;
  /** Larger touch targets + thicker progress bar for the mobile layout. */
  compact?: boolean;
}

export function PlayerControls({
  onSeekTo,
  onSeekBy,
  onSetRate,
  singleVideoMode,
  onToggleSingleVideo,
  compact = false,
}: PlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    togglePlay,
    setVolume,
    toggleMute,
    toggleScreenFreeMode,
  } = usePlayerStore();

  const ratio = progressRatio(currentTime, duration);

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeekTo(pct * duration);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-right font-mono text-xs text-text-secondary nums-tabular">
          {formatTimestamp(currentTime)}
        </span>
        <div
          role="slider"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
          onClick={handleScrub}
          className={cn(
            "group relative flex-1 cursor-pointer",
            compact ? "h-2" : "h-1 hover:h-1.5",
            "transition-[height] duration-150",
          )}
        >
          <div className="absolute inset-0 my-auto h-full rounded-full bg-surface-secondary" />
          <div
            className="absolute inset-y-0 left-0 my-auto h-full rounded-full bg-accent"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className="w-12 shrink-0 font-mono text-xs text-text-secondary nums-tabular">
          {formatTimestamp(duration)}
        </span>
      </div>

      {/* Primary controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => onSeekBy(-15)}
          aria-label="Reculer de 15 secondes"
          className="flex flex-col items-center text-text-secondary transition-colors hover:text-text-primary"
        >
          <RotateCcw className={compact ? "h-7 w-7" : "h-6 w-6"} />
          <span className="text-[10px] font-medium">15</span>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          className={cn(
            "flex items-center justify-center rounded-full bg-accent text-white shadow-soft transition-colors hover:bg-accent-hover",
            compact ? "h-14 w-14" : "h-12 w-12",
          )}
        >
          {isPlaying ? (
            <Pause className={compact ? "h-7 w-7" : "h-6 w-6"} />
          ) : (
            <Play className={cn(compact ? "h-7 w-7" : "h-6 w-6", "ml-0.5")} />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSeekBy(15)}
          aria-label="Avancer de 15 secondes"
          className="flex flex-col items-center text-text-secondary transition-colors hover:text-text-primary"
        >
          <RotateCw className={compact ? "h-7 w-7" : "h-6 w-6"} />
          <span className="text-[10px] font-medium">15</span>
        </button>
      </div>

      {/* Secondary controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Speed */}
        <div className="flex items-center gap-2">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onSetRate(r)}
              className={cn(
                "text-sm transition-colors duration-150",
                playbackRate === r
                  ? "font-medium text-accent underline underline-offset-4"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {r}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 className="h-[18px] w-[18px]" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-20 cursor-pointer accent-accent"
            />
          </div>

          {/* Single-video mode */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <span className="hidden sm:inline">Une seule vidéo</span>
            <Switch
              checked={singleVideoMode}
              onCheckedChange={onToggleSingleVideo}
              aria-label="Mode une seule vidéo"
            />
          </label>

          {/* Screen-free mode */}
          <button
            type="button"
            onClick={toggleScreenFreeMode}
            aria-label="Mode sans écran"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            <MoonStar className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
