"use client";

import { Play, Pause, RotateCcw, RotateCw, NotebookPen, Zap } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { formatTimestamp } from "@/lib/utils/time";
import type { Video } from "@/lib/types";

interface ScreenFreeModeProps {
  video: Video;
  onSeekBy: (delta: number) => void;
  onAddNote: () => void;
  onAddAction: () => void;
}

/**
 * Full black, audio-first overlay. Minimal: title, channel, remaining time, and
 * large transport controls. Keeps the screen awake while shown.
 */
export function ScreenFreeMode({
  video,
  onSeekBy,
  onAddNote,
  onAddAction,
}: ScreenFreeModeProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    toggleScreenFreeMode,
  } = usePlayerStore();

  useWakeLock(true);

  const remaining = Math.max(0, duration - currentTime);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-[#0A0A09] px-6 text-center">
      <div className="max-w-md">
        <p className="text-lg font-medium text-white">{video.title}</p>
        <p className="mt-1 text-sm text-white/50">{video.channel_name}</p>
        <p className="mt-4 font-mono text-sm text-white/70 nums-tabular">
          − {formatTimestamp(remaining)}
        </p>
      </div>

      <div className="flex items-center gap-10">
        <button
          type="button"
          onClick={() => onSeekBy(-15)}
          aria-label="Reculer de 15 secondes"
          className="flex flex-col items-center text-white/70 transition-colors hover:text-white"
        >
          <RotateCcw className="h-[60px] w-[60px]" strokeWidth={1.25} />
          <span className="-mt-2 text-xs font-medium">15</span>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0A0A09] transition-transform active:scale-95"
        >
          {isPlaying ? (
            <Pause className="h-9 w-9" />
          ) : (
            <Play className="ml-1 h-9 w-9" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSeekBy(15)}
          aria-label="Avancer de 15 secondes"
          className="flex flex-col items-center text-white/70 transition-colors hover:text-white"
        >
          <RotateCw className="h-[60px] w-[60px]" strokeWidth={1.25} />
          <span className="-mt-2 text-xs font-medium">15</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddNote}
          className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
        >
          <NotebookPen className="h-4 w-4" />
          Ajouter une note
        </button>
        <button
          type="button"
          onClick={onAddAction}
          className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
        >
          <Zap className="h-4 w-4" />
          Créer une action
        </button>
      </div>

      <button
        type="button"
        onClick={toggleScreenFreeMode}
        className="absolute bottom-8 text-xs text-white/40 transition-colors hover:text-white/70"
      >
        Quitter le mode sans écran
      </button>
    </div>
  );
}
