import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Video } from "@/lib/types";

export type PlaybackRate = 1 | 1.25 | 1.5 | 2;

export interface SessionIntention {
  reason: string;
  expectedResult: string;
  maxDurationMinutes: number | null;
}

interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  playbackRate: PlaybackRate;
  volume: number; // 0..1
  isMuted: boolean;

  isMinimized: boolean;
  isScreenFreeMode: boolean;
  /** Audio-only mode hides the video frame (the global iframe host honors it). */
  isAudioMode: boolean;

  /** Intention screen gates playback until the user sets (or skips) intention. */
  showIntentionScreen: boolean;
  intention: SessionIntention | null;

  sessionId: string | null;
  sessionStartTime: Date | null;
  /** Seconds listened in the *current* session (drives reflection pauses). */
  sessionSeconds: number;

  todayListenedSeconds: number;
  dailyLimitSeconds: number;
  /** True once the limit dialog has fired this session (prevents re-firing). */
  limitReached: boolean;
  /** User opted to keep going past the limit for now. */
  limitOverridden: boolean;

  /** Reflection-pause cadence (0 = disabled) and trigger flag. */
  reflectionIntervalSeconds: number;
  reflectionDue: boolean;
  lastReflectionAt: number; // sessionSeconds mark of last pause

  /** True once the video reaches its end (or is marked finished). */
  videoEnded: boolean;

  // ── actions ──────────────────────────────────────────────
  playVideo: (video: Video) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  togglePlay: () => void;
  stopVideo: () => void;

  setCurrentTime: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  minimize: () => void;
  maximize: () => void;
  toggleScreenFreeMode: () => void;
  setAudioMode: (value: boolean) => void;
  toggleAudioMode: () => void;
  /** Swap the current video in place (same playback), e.g. synthetic → DB row. */
  replaceVideo: (video: Video) => void;

  setIntention: (intention: SessionIntention) => void;
  skipIntention: () => void;

  /** Called ~every second while playing; advances session + reflection timers. */
  tickSession: () => void;
  dismissReflection: () => void;

  setTodayStats: (listenedSeconds: number, dailyLimitSeconds: number) => void;
  overrideLimit: () => void;
  resetLimit: () => void;

  setReflectionInterval: (seconds: number) => void;

  markEnded: () => void;
  clearEnded: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
  currentVideo: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 1,
  isMuted: false,

  isMinimized: false,
  isScreenFreeMode: false,
  isAudioMode: false,

  showIntentionScreen: false,
  intention: null,

  sessionId: null,
  sessionStartTime: null,
  sessionSeconds: 0,

  todayListenedSeconds: 0,
  dailyLimitSeconds: 60 * 60,
  limitReached: false,
  limitOverridden: false,

  reflectionIntervalSeconds: 0,
  reflectionDue: false,
  lastReflectionAt: 0,

  videoEnded: false,

  playVideo: (video) =>
    set({
      currentVideo: video,
      currentTime: video.listened_seconds ?? 0,
      duration: video.duration_seconds ?? 0,
      isPlaying: false, // intention screen gates actual playback
      isMinimized: false,
      showIntentionScreen: true,
      intention: null,
      sessionId: null,
      sessionStartTime: null,
      sessionSeconds: 0,
      limitReached: false,
      limitOverridden: false,
      reflectionDue: false,
      lastReflectionAt: 0,
      videoEnded: false,
      isAudioMode: false,
    }),

  pauseVideo: () => set({ isPlaying: false }),
  resumeVideo: () => {
    if (get().showIntentionScreen) return;
    set({ isPlaying: true });
  },
  togglePlay: () => {
    const s = get();
    if (s.showIntentionScreen) return;
    set({ isPlaying: !s.isPlaying });
  },

  stopVideo: () =>
    set({
      currentVideo: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMinimized: false,
      isScreenFreeMode: false,
      isAudioMode: false,
      showIntentionScreen: false,
      intention: null,
      sessionId: null,
      sessionStartTime: null,
      sessionSeconds: 0,
      reflectionDue: false,
    }),

  setCurrentTime: (seconds) => set({ currentTime: Math.max(0, seconds) }),
  setDuration: (seconds) => set({ duration: Math.max(0, seconds) }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) =>
    set({ volume: Math.min(1, Math.max(0, volume)), isMuted: volume === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  toggleScreenFreeMode: () =>
    set((s) => ({ isScreenFreeMode: !s.isScreenFreeMode })),
  setAudioMode: (value) => set({ isAudioMode: value }),
  toggleAudioMode: () => set((s) => ({ isAudioMode: !s.isAudioMode })),
  replaceVideo: (video) =>
    set((s) =>
      s.currentVideo?.youtube_id === video.youtube_id
        ? { currentVideo: video }
        : {},
    ),

  setIntention: (intention) =>
    set({
      intention,
      showIntentionScreen: false,
      isPlaying: true,
      sessionStartTime: new Date(),
      sessionId: crypto.randomUUID(),
    }),

  skipIntention: () =>
    set({
      showIntentionScreen: false,
      isPlaying: true,
      sessionStartTime: new Date(),
      sessionId: crypto.randomUUID(),
    }),

  tickSession: () => {
    const s = get();
    if (!s.isPlaying) return;

    const sessionSeconds = s.sessionSeconds + 1;
    const todayListenedSeconds = s.todayListenedSeconds + 1;

    // Daily limit — fire once, auto-pause unless the user overrode it.
    let isPlaying: boolean = s.isPlaying;
    let limitReached: boolean = s.limitReached;
    if (
      !s.limitOverridden &&
      !s.limitReached &&
      todayListenedSeconds >= s.dailyLimitSeconds
    ) {
      limitReached = true;
      isPlaying = false;
    }

    // Reflection pause — fire on cadence, auto-pause.
    let reflectionDue = s.reflectionDue;
    let lastReflectionAt = s.lastReflectionAt;
    if (
      s.reflectionIntervalSeconds > 0 &&
      sessionSeconds - s.lastReflectionAt >= s.reflectionIntervalSeconds
    ) {
      reflectionDue = true;
      lastReflectionAt = sessionSeconds;
      isPlaying = false;
    }

    set({
      sessionSeconds,
      todayListenedSeconds,
      isPlaying,
      limitReached,
      reflectionDue,
      lastReflectionAt,
    });
  },

  dismissReflection: () => set({ reflectionDue: false }),

  setTodayStats: (listenedSeconds, dailyLimitSeconds) =>
    set({
      todayListenedSeconds: listenedSeconds,
      dailyLimitSeconds,
    }),

  overrideLimit: () =>
    set({ limitReached: false, limitOverridden: true, isPlaying: true }),
  resetLimit: () => set({ limitReached: false }),

  setReflectionInterval: (seconds) =>
    set({ reflectionIntervalSeconds: Math.max(0, seconds) }),

  markEnded: () => set({ videoEnded: true, isPlaying: false }),
  clearEnded: () => set({ videoEnded: false }),
    }),
    {
      name: "zy-player",
      storage: createJSONStorage(() => localStorage),
      // Persist only what's useful to resume after a refresh. We deliberately
      // skip isPlaying (resume paused), the intention screen, and per-session
      // flags so a reload doesn't fight autoplay or re-show the intention.
      partialize: (s) => ({
        currentVideo: s.currentVideo,
        currentTime: s.currentTime,
        duration: s.duration,
        playbackRate: s.playbackRate,
        volume: s.volume,
        isMuted: s.isMuted,
      }),
      // On rehydrate, the restored video must NOT re-gate on the intention
      // screen, and playback starts paused.
      onRehydrateStorage: () => (state) => {
        if (state?.currentVideo) {
          state.isPlaying = false;
          state.showIntentionScreen = false;
          state.isMinimized = true;
        }
      },
    },
  ),
);
