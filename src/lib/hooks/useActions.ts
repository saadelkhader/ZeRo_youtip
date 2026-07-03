"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAction,
  deleteAction,
  getActions,
  getActionsForVideo,
  getDailyActions,
  updateAction,
  updateActionStatus,
  type ActionWithContext,
  type CreateActionInput,
  type UpdateActionInput,
} from "@/lib/actions/userActions";
import type { Action, ActionStatus } from "@/lib/types";
import { toast } from "@/lib/toast";

const videoActionsKey = (videoId: string) => ["actions", "video", videoId] as const;
const ALL_KEY = ["actions", "all"] as const;
const DAILY_KEY = ["actions", "daily"] as const;

export function useVideoActions(videoId: string | null) {
  return useQuery({
    queryKey: videoActionsKey(videoId ?? "none"),
    enabled: Boolean(videoId),
    queryFn: async (): Promise<Action[]> => {
      if (!videoId) return [];
      try {
        return await getActionsForVideo(videoId);
      } catch {
        return [];
      }
    },
  });
}

export function useActions() {
  return useQuery({
    queryKey: ALL_KEY,
    queryFn: async (): Promise<ActionWithContext[]> => {
      try {
        return await getActions();
      } catch {
        return [];
      }
    },
  });
}

export function useDailyActions() {
  return useQuery({
    queryKey: DAILY_KEY,
    queryFn: async (): Promise<ActionWithContext[]> => {
      try {
        return await getDailyActions();
      } catch {
        return [];
      }
    },
  });
}

function invalidateActions(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["actions"] });
}

export function useAddAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActionInput) => createAction(input),
    onSuccess: () => {
      invalidateActions(qc);
      toast.actionCreated();
    },
    onError: () => toast.networkError(),
  });
}

export function useUpdateAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateActionInput }) =>
      updateAction(id, input),
    onSuccess: () => invalidateActions(qc),
  });
}

export function useUpdateActionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) =>
      updateActionStatus(id, status),
    onSuccess: (_data, vars) => {
      invalidateActions(qc);
      if (vars.status === "done") toast.actionDone();
    },
  });
}

export function useDeleteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAction(id),
    onSuccess: () => invalidateActions(qc),
  });
}
