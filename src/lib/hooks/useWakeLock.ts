"use client";

import * as React from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

/**
 * Keeps the screen awake while `active` is true, using the Wake Lock API.
 * Silently no-ops where unsupported, and re-acquires on visibility change.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = React.useRef<WakeLockSentinelLike | null>(null);

  React.useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return;

    let released = false;

    async function acquire() {
      try {
        if (!active || released) return;
        sentinelRef.current = await nav.wakeLock!.request("screen");
        sentinelRef.current.addEventListener("release", () => {
          sentinelRef.current = null;
        });
      } catch {
        // User gesture missing / denied — ignore.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible" && active) void acquire();
    }

    if (active) void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}
