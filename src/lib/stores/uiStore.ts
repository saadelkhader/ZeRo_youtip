import { create } from "zustand";

interface UiState {
  /** Mobile "More" drawer (bottom nav overflow). */
  isMoreDrawerOpen: boolean;
  /** Global search command palette. */
  isSearchOpen: boolean;
  /** Focus mode hides chrome around the player. */
  focusMode: boolean;

  openMoreDrawer: () => void;
  closeMoreDrawer: () => void;
  toggleMoreDrawer: () => void;

  setSearchOpen: (open: boolean) => void;

  toggleFocusMode: () => void;
}

// Note: the global "add video" / "add vault" dialog state lives in vaultStore,
// since those dialogs are tightly coupled to vault data.
export const useUiStore = create<UiState>((set) => ({
  isMoreDrawerOpen: false,
  isSearchOpen: false,
  focusMode: false,

  openMoreDrawer: () => set({ isMoreDrawerOpen: true }),
  closeMoreDrawer: () => set({ isMoreDrawerOpen: false }),
  toggleMoreDrawer: () => set((s) => ({ isMoreDrawerOpen: !s.isMoreDrawerOpen })),

  setSearchOpen: (open) => set({ isSearchOpen: open }),

  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
}));
