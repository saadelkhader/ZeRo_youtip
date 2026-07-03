"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Pause, Play, X, RotateCcw, RotateCw, ChevronUp } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { playerControls } from "@/lib/player-controls";
import { progressRatio } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

/**
 * Persistent mini-player. Visible whenever a video is loaded, except on the
 * full player route. Desktop: 64px bottom bar (sidebar-offset) with transport
 * controls. Mobile: 60px bar above the bottom nav, tap to open. Slides up in.
 */
export function MiniPlayer() {
  const pathname = usePathname();
  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    stopVideo,
    showIntentionScreen,
  } = usePlayerStore();

  const onPlayerRoute = pathname?.startsWith("/player/") ?? false;

  // Hidden on the player route, when nothing is loaded, or during the
  // intention screen (playback hasn't begun).
  if (!currentVideo || onPlayerRoute || showIntentionScreen) return null;

  const ratio = progressRatio(currentTime, duration);
  const href = `/player/${currentVideo.youtube_id}`;
  const thumb = currentVideo.thumbnail_url;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[60px] z-30 md:bottom-0 md:left-60",
        "surface-blur border-t border-border-light animate-slide-up",
      )}
      style={{ height: 64 }}
    >
      {/* Progress bar (2px, bottom) */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] bg-surface-secondary"
        role="progressbar"
        aria-label="Progression de la lecture"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
      >
        <div
          className="h-full bg-accent"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="flex h-full items-center gap-3 px-3 md:px-6">
        {/* Thumbnail + title → open the player */}
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-7 w-9 shrink-0 overflow-hidden rounded-sm bg-surface-secondary md:h-[27px] md:w-9">
            {thumb ? (
              <Image
                src={thumb}
                alt={`Miniature : ${currentVideo.title}`}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {currentVideo.title}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {currentVideo.channel_name}
            </p>
          </div>
        </Link>

        {/* Mobile: play/pause only */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white md:hidden"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>

        {/* Desktop: full transport */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <button
            type="button"
            onClick={() => playerControls.seekBy(-15)}
            aria-label="Reculer de 15 secondes"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Lecture"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => playerControls.seekBy(15)}
            aria-label="Avancer de 15 secondes"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <RotateCw className="h-[18px] w-[18px]" />
          </button>

          <Link
            href={href}
            aria-label="Ouvrir le lecteur"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <ChevronUp className="h-[18px] w-[18px]" />
          </Link>
          <button
            type="button"
            onClick={stopVideo}
            aria-label="Fermer la session"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
