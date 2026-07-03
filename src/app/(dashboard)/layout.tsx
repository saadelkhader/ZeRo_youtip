import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { MiniPlayer } from "@/components/layout/MiniPlayer";
import { AddVideoDialog } from "@/components/shared/AddVideoDialog";
import { VaultDialog } from "@/components/vaults/VaultDialog";
import { GlobalShortcuts } from "@/components/shared/GlobalShortcuts";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { AddVideoFab } from "@/components/shared/AddVideoFab";

/**
 * Dashboard shell.
 * - Desktop (md+): fixed 240px sidebar, content offset by ml-60, mini-player
 *   pinned to the bottom (72px) offset by the sidebar.
 * - Mobile: full-width content, fixed bottom nav (60px), mini-player floating
 *   just above it.
 * Bottom padding leaves room for the nav + mini-player so nothing is occluded.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />

      <div className="md:ml-60">
        <HeaderBar />
        <main className="px-4 pb-[180px] pt-4 md:px-8 md:pb-[112px] md:pt-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <AddVideoFab />
      <MiniPlayer />
      <BottomNav />

      {/* Global, accessible-from-anywhere dialogs + shortcuts */}
      <AddVideoDialog />
      <VaultDialog />
      <GlobalSearch />
      <GlobalShortcuts />
    </div>
  );
}
