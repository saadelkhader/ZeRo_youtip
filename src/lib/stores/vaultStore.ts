import { create } from "zustand";
import type { Vault } from "@/lib/types";

interface VaultState {
  /** Locally cached vaults (server data via TanStack Query mirrors into here). */
  vaults: Vault[];
  /** Currently focused vault (for filtering / detail views). */
  selectedVaultId: string | null;

  /** Global dialogs — accessible from anywhere (sidebar, FAB, Ctrl+K). */
  isAddVideoOpen: boolean;
  isAddVaultOpen: boolean;
  /** Vault being edited, if the vault dialog was opened in edit mode. */
  editingVault: Vault | null;

  setVaults: (vaults: Vault[]) => void;
  addVault: (vault: Vault) => void;
  updateVault: (vault: Vault) => void;
  removeVault: (id: string) => void;

  setSelectedVault: (id: string | null) => void;

  openAddVideo: () => void;
  closeAddVideo: () => void;

  openAddVault: (vault?: Vault) => void;
  closeAddVault: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  vaults: [],
  selectedVaultId: null,
  isAddVideoOpen: false,
  isAddVaultOpen: false,
  editingVault: null,

  setVaults: (vaults) => set({ vaults }),

  addVault: (vault) => set((s) => ({ vaults: [vault, ...s.vaults] })),

  updateVault: (vault) =>
    set((s) => ({
      vaults: s.vaults.map((v) => (v.id === vault.id ? vault : v)),
    })),

  removeVault: (id) =>
    set((s) => ({ vaults: s.vaults.filter((v) => v.id !== id) })),

  setSelectedVault: (id) => set({ selectedVaultId: id }),

  openAddVideo: () => set({ isAddVideoOpen: true }),
  closeAddVideo: () => set({ isAddVideoOpen: false }),

  openAddVault: (vault) =>
    set({ isAddVaultOpen: true, editingVault: vault ?? null }),
  closeAddVault: () => set({ isAddVaultOpen: false, editingVault: null }),
}));
