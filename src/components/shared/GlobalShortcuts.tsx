"use client";

import * as React from "react";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { useUiStore } from "@/lib/stores/uiStore";

/**
 * Global keyboard shortcuts:
 * - Ctrl/Cmd+K        → open global search
 * - Ctrl/Cmd+Shift+K  → open the quick "add video" dialog
 * Renders nothing.
 */
export function GlobalShortcuts() {
  const openAddVideo = useVaultStore((s) => s.openAddVideo);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (e.shiftKey) openAddVideo();
        else setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAddVideo, setSearchOpen]);

  return null;
}
