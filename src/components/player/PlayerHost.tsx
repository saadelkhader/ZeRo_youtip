"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";
import { useListeningSession } from "@/lib/hooks/useListeningSession";
import { cn } from "@/lib/utils/cn";

/** Id of the on-page stage that the player snaps into while on /player. */
export const PLAYER_STAGE_ID = "zy-player-stage";

/**
 * Single, app-wide host for the YouTube iframe. Mounted once in the dashboard
 * layout so audio keeps playing across navigation. While on /player, the iframe
 * is positioned over the page's stage element; elsewhere it's parked offscreen
 * (1×1, audio only) so the mini-player can keep controlling it.
 */
export function PlayerHost() {
  const currentVideo = usePlayerStore((s) => s.currentVideo);
  // Only mount the player machinery once a video exists, so idle pages (auth,
  // etc.) don't spin up the IFrame API or hit the sessions endpoint.
  if (!currentVideo) return null;
  return <ActivePlayerHost />;
}

function ActivePlayerHost() {
  const pathname = usePathname();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const currentVideo = usePlayerStore((s) => s.currentVideo);
  const isScreenFree = usePlayerStore((s) => s.isScreenFreeMode);
  const isAudioMode = usePlayerStore((s) => s.isAudioMode);

  const onPlayerRoute = pathname?.startsWith("/player/") ?? false;

  const { persist } = useListeningSession();
  useYouTubePlayer(containerRef, { onPersist: persist });

  // Position the fixed wrapper over the page stage when on /player; otherwise
  // shrink it offscreen (audio continues). Recompute on resize/scroll/route.
  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    function place() {
      if (!wrapper) return;
      const stage = onPlayerRoute
        ? document.getElementById(PLAYER_STAGE_ID)
        : null;

      if (stage) {
        const r = stage.getBoundingClientRect();
        wrapper.style.top = `${r.top}px`;
        wrapper.style.left = `${r.left}px`;
        wrapper.style.width = `${r.width}px`;
        wrapper.style.height = `${r.height}px`;
        wrapper.style.opacity = "1";
        wrapper.style.pointerEvents = "auto";
        wrapper.style.zIndex = "10";
      } else {
        // Park offscreen — keep it rendered so playback persists.
        wrapper.style.top = "0px";
        wrapper.style.left = "0px";
        wrapper.style.width = "1px";
        wrapper.style.height = "1px";
        wrapper.style.opacity = "0";
        wrapper.style.pointerEvents = "none";
        wrapper.style.zIndex = "-1";
      }
    }

    place();
    const ro = new ResizeObserver(place);
    const stage = document.getElementById(PLAYER_STAGE_ID);
    if (stage) ro.observe(stage);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    // Re-place on the next frames too (layout settles after route change).
    const raf = requestAnimationFrame(place);
    const t = setTimeout(place, 120);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [onPlayerRoute, pathname, currentVideo]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden={!onPlayerRoute}
      className={cn(
        "fixed overflow-hidden rounded-lg bg-black",
        // Hide the video frame for screen-free / audio modes (audio keeps
        // playing — `invisible` doesn't unmount the iframe).
        (isScreenFree || isAudioMode) && "invisible",
      )}
      style={{ position: "fixed" }}
    >
      <div
        ref={containerRef}
        className="h-full w-full [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
      />
    </div>
  );
}
