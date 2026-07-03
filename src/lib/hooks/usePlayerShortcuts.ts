"use client";

import * as React from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";

interface ShortcutHandlers {
  onSeekBy: (delta: number) => void;
  onFocusNote: () => void;
  onAddAction: () => void;
  onEscape: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/**
 * Desktop player shortcuts: Space play/pause, ←/→ seek 15s, N focus note,
 * A action dialog, M screen-free, Escape close overlays. Ignored while typing.
 */
export function usePlayerShortcuts({
  onSeekBy,
  onFocusNote,
  onAddAction,
  onEscape,
}: ShortcutHandlers) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Escape works even from inputs (to blur / close overlays).
      if (e.key === "Escape") {
        onEscape();
        return;
      }
      if (isTypingTarget(e.target)) return;

      const store = usePlayerStore.getState();
      switch (e.key) {
        case " ":
          e.preventDefault();
          store.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onSeekBy(-15);
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeekBy(15);
          break;
        case "n":
        case "N":
          e.preventDefault();
          onFocusNote();
          break;
        case "a":
        case "A":
          e.preventDefault();
          onAddAction();
          break;
        case "m":
        case "M":
          e.preventDefault();
          store.toggleScreenFreeMode();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSeekBy, onFocusNote, onAddAction, onEscape]);
}
