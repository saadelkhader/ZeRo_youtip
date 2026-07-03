"use client";

import * as React from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import {
  getTodayStats,
  startSession,
  updateListenedTime,
  endSession,
} from "@/lib/actions/sessions";

/**
 * Loads today's listening total + user limits into the player store, opens a
 * DB session for the current video, and exposes a `persist` callback for the
 * 10s cadence. Degrades silently when there's no backend (returns no-ops).
 */
export function useListeningSession() {
  const currentVideo = usePlayerStore((s) => s.currentVideo);
  const setTodayStats = usePlayerStore((s) => s.setTodayStats);
  const setReflectionInterval = usePlayerStore(
    (s) => s.setReflectionInterval,
  );

  const dbSessionId = React.useRef<string | null>(null);

  // Load today's stats + preferences once.
  React.useEffect(() => {
    let active = true;
    getTodayStats()
      .then((stats) => {
        if (!active) return;
        setTodayStats(stats.listenedSeconds, stats.dailyLimitMinutes * 60);
        setReflectionInterval(stats.reflectionPauseMinutes * 60);
      })
      .catch(() => {
        // No backend yet — keep store defaults.
      });
    return () => {
      active = false;
    };
  }, [setTodayStats, setReflectionInterval]);

  // Open a DB session — only once we have a REAL (persisted) video id.
  // Synthetic stand-ins ("yt:…") have no DB row, so a session insert would
  // fail the foreign key; we wait for ensureVideo to swap in the real one.
  const realVideoId =
    currentVideo && !currentVideo.id.startsWith("yt:")
      ? currentVideo.id
      : null;

  React.useEffect(() => {
    if (!realVideoId) return;
    let active = true;
    startSession(realVideoId)
      .then((id) => {
        if (active) dbSessionId.current = id;
      })
      .catch(() => {
        dbSessionId.current = null;
      });

    return () => {
      active = false;
      const id = dbSessionId.current;
      if (id) {
        const seconds = usePlayerStore.getState().sessionSeconds;
        void endSession(id, seconds).catch(() => {});
      }
      dbSessionId.current = null;
    };
  }, [realVideoId]);

  const persist = React.useCallback(
    (positionSeconds: number, sessionSeconds: number) => {
      const id = dbSessionId.current;
      const video = usePlayerStore.getState().currentVideo;
      if (!id || !video || video.id.startsWith("yt:")) return;
      void updateListenedTime(
        id,
        video.id,
        sessionSeconds,
        positionSeconds,
      ).catch(() => {});
    },
    [],
  );

  return { persist };
}
