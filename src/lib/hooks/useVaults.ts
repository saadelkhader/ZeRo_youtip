"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  archiveVault,
  createVault,
  deleteVault,
  getVault,
  getVaults,
  updateVault,
  type VaultInput,
} from "@/lib/actions/vaults";
import type { Vault } from "@/lib/types";

const VAULTS_KEY = ["vaults"] as const;

/** A single vault by id. */
export function useVault(id: string | null) {
  return useQuery({
    queryKey: ["vault", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Vault | null> => {
      if (!id) return null;
      try {
        return await getVault(id);
      } catch {
        return null;
      }
    },
  });
}

/**
 * Vault list. Returns [] (not an error) when the user isn't authenticated yet,
 * so the UI stays browsable before Supabase is connected.
 */
export function useVaults() {
  return useQuery({
    queryKey: VAULTS_KEY,
    queryFn: async (): Promise<Vault[]> => {
      try {
        return await getVaults();
      } catch {
        return [];
      }
    },
  });
}

export function useCreateVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VaultInput) => createVault(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VAULTS_KEY }),
  });
}

export function useUpdateVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<VaultInput> & { is_archived?: boolean };
    }) => updateVault(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VAULTS_KEY }),
  });
}

export function useArchiveVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archiveVault(id, archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: VAULTS_KEY }),
  });
}

export function useDeleteVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VAULTS_KEY }),
  });
}
