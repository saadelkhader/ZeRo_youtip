"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addVideo,
  deleteVideo,
  getQueueByVault,
  getVideosByVault,
  moveVideoToVault,
  reorderQueue,
  updateVideo,
  type AddVideoInput,
} from "@/lib/actions/videos";
import type { Video } from "@/lib/types";
import { toast } from "@/lib/toast";

const queueKey = (vaultId?: string | null) =>
  ["queue", vaultId ?? "all"] as const;

/** All videos belonging to a vault (any non-archived status). */
export function useVaultVideos(vaultId: string | null) {
  return useQuery({
    queryKey: ["vault-videos", vaultId],
    enabled: Boolean(vaultId),
    queryFn: async (): Promise<Video[]> => {
      if (!vaultId) return [];
      try {
        return await getVideosByVault(vaultId);
      } catch {
        return [];
      }
    },
  });
}

/**
 * Queue, optionally scoped to a vault. Returns [] when unauthenticated so the
 * UI stays browsable before Supabase is connected.
 */
export function useQueue(vaultId?: string | null) {
  return useQuery({
    queryKey: queueKey(vaultId),
    queryFn: async (): Promise<Video[]> => {
      try {
        return await getQueueByVault(vaultId);
      } catch {
        return [];
      }
    },
  });
}

function invalidateQueue(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["queue"] });
}

export function useAddVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddVideoInput) => addVideo(input),
    onSuccess: (_data, vars) => {
      invalidateQueue(qc);
      if (vars.status !== "playing") toast.videoQueued();
    },
    onError: () => toast.networkError(),
  });
}

export function useUpdateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateVideo>[1];
    }) => updateVideo(id, data),
    onSuccess: () => invalidateQueue(qc),
  });
}

export function useDeleteVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => invalidateQueue(qc),
  });
}

export function useMoveVideoToVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      videoId,
      vaultId,
    }: {
      videoId: string;
      vaultId: string | null;
    }) => moveVideoToVault(videoId, vaultId),
    onSuccess: () => invalidateQueue(qc),
  });
}

export function useReorderQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (videoIds: string[]) => reorderQueue(videoIds),
    // Optimistic ordering is handled in the component's local state; just
    // refetch to confirm on settle.
    onSettled: () => invalidateQueue(qc),
  });
}
