"use client";

import { Plus } from "lucide-react";
import { useVaultStore } from "@/lib/stores/vaultStore";

/**
 * Mobile floating action button to add a video. Sits above the bottom nav and
 * mini-player; hidden on desktop where the header CTA + Ctrl+K cover it.
 */
export function AddVideoFab() {
  const openAddVideo = useVaultStore((s) => s.openAddVideo);

  return (
    <button
      type="button"
      onClick={openAddVideo}
      aria-label="Ajouter une vidéo"
      className="fixed bottom-[136px] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-elevated transition-colors duration-150 hover:bg-accent-hover md:hidden"
    >
      <Plus className="h-5 w-5" />
    </button>
  );
}
