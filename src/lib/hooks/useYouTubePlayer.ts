"use client";

import * as React from "react";
import { usePlayerStore, type PlaybackRate } from "@/lib/stores/playerStore";
import {
  setPlayerControls,
  clearPlayerControls,
} from "@/lib/player-controls";

// ── Minimal YT IFrame API typings (only what we use) ──────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number; // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering
  setPlaybackRate(rate: number): void;
  setVolume(volume: number): void; // 0..100
  mute(): void;
  unMute(): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    opts: Record<string, unknown>,
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Load the IFrame API once, shared across all callers. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

interface UseYouTubePlayerOptions {
  /** Persist progress every 10s. No-op if absent (e.g. unauthenticated). */
  onPersist?: (positionSeconds: number, sessionSeconds: number) => void;
}

/**
 * Binds a YT.Player instance (mounted into `containerRef`) to the player store.
 * Store intent (isPlaying, currentTime via seek, rate, volume) drives the
 * player; player events feed time/duration back into the store. Also runs the
 * 1s session tick and a 10s persistence cadence.
 *
 * Returns control helpers the UI can call directly.
 */
export function useYouTubePlayer(
  containerRef: React.RefObject<HTMLDivElement>,
  { onPersist }: UseYouTubePlayerOptions = {},
) {
  const playerRef = React.useRef<YTPlayer | null>(null);
  const [ready, setReady] = React.useState(false);

  const currentVideo = usePlayerStore((s) => s.currentVideo);
  const youtubeId = currentVideo?.youtube_id ?? null;
  // Resume where the user actually was: prefer the (persisted) current time,
  // falling back to the video's saved listened position.
  const startAt = Math.max(
    usePlayerStore.getState().currentTime || 0,
    currentVideo?.listened_seconds ?? 0,
  );

  // ── Create / recreate the player when the video changes ──────
  React.useEffect(() => {
    if (!youtubeId || !containerRef.current) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      // Tear down a previous instance before creating a new one.
      playerRef.current?.destroy();
      setReady(false);

      const host = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(host);

      playerRef.current = new YT.Player(host, {
        videoId: youtubeId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
          start: Math.floor(startAt),
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            const { volume, isMuted, playbackRate, duration } =
              usePlayerStore.getState();
            playerRef.current?.setVolume(Math.round(volume * 100));
            if (isMuted) playerRef.current?.mute();
            playerRef.current?.setPlaybackRate(playbackRate);
            if (!duration) {
              const d = playerRef.current?.getDuration() ?? 0;
              if (d) usePlayerStore.getState().setDuration(d);
            }
          },
          onStateChange: (e: { data: number }) => {
            const YTState = window.YT?.PlayerState;
            if (!YTState) return;
            const store = usePlayerStore.getState();
            if (e.data === YTState.PLAYING && !store.isPlaying) {
              store.resumeVideo();
            } else if (e.data === YTState.PAUSED && store.isPlaying) {
              store.pauseVideo();
            } else if (e.data === YTState.ENDED) {
              store.markEnded();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
    // Only re-create on a genuinely new video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // Cleanup on unmount.
  React.useEffect(
    () => () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    },
    [],
  );

  // ── Drive play/pause from the store ──────────────────────────
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  React.useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();
  }, [isPlaying, ready]);

  // ── Drive rate / volume / mute from the store ────────────────
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  React.useEffect(() => {
    if (ready) playerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate, ready]);

  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  React.useEffect(() => {
    if (!ready || !playerRef.current) return;
    playerRef.current.setVolume(Math.round(volume * 100));
    if (isMuted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [volume, isMuted, ready]);

  // ── Polling: sync time, run session tick + persistence ───────
  const persistRef = React.useRef(onPersist);
  persistRef.current = onPersist;

  React.useEffect(() => {
    if (!ready) return;
    let persistAccumulator = 0;

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      const store = usePlayerStore.getState();
      if (!player || !store.currentVideo) return;

      const t = player.getCurrentTime();
      store.setCurrentTime(t);

      // Source of truth for counting = the REAL player state, not the store
      // flag (which can drift after re-creates / autoplay blocks).
      const playing =
        player.getPlayerState() === (window.YT?.PlayerState.PLAYING ?? 1);

      // Keep the store flag in sync with reality.
      if (playing && !store.isPlaying) store.resumeVideo();
      else if (!playing && store.isPlaying) store.pauseVideo();

      if (playing) {
        store.tickSession();
        persistAccumulator += 1;
        if (persistAccumulator >= 10) {
          persistAccumulator = 0;
          persistRef.current?.(t, usePlayerStore.getState().sessionSeconds);
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [ready]);

  // ── Imperative controls for the UI ───────────────────────────
  const seekTo = React.useCallback((seconds: number) => {
    playerRef.current?.seekTo(Math.max(0, seconds), true);
    usePlayerStore.getState().setCurrentTime(Math.max(0, seconds));
  }, []);

  const seekBy = React.useCallback(
    (delta: number) => {
      const t = playerRef.current?.getCurrentTime() ?? 0;
      seekTo(t + delta);
    },
    [seekTo],
  );

  const setRate = React.useCallback((rate: PlaybackRate) => {
    usePlayerStore.getState().setPlaybackRate(rate);
  }, []);

  // Expose imperative controls app-wide (mini-player, screen-free, shortcuts).
  React.useEffect(() => {
    setPlayerControls({ seekTo, seekBy, setRate });
    return () => clearPlayerControls();
  }, [seekTo, seekBy, setRate]);

  return { ready, seekTo, seekBy, setRate };
}
