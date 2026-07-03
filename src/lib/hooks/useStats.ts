"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTodayStats,
  getWeeklyStats,
  getVaultStats,
  getTopChannels,
  getImpactScore,
  type TodayStats,
  type WeeklyStats,
  type VaultStat,
  type ChannelStat,
} from "@/lib/actions/stats";

const EMPTY_TODAY: TodayStats = {
  secondsListened: 0,
  videosCompleted: 0,
  notesCreated: 0,
  actionsCreated: 0,
  actionsCompleted: 0,
};

export function useTodayStats() {
  return useQuery({
    queryKey: ["stats", "today"],
    queryFn: async (): Promise<TodayStats> => {
      try {
        return await getTodayStats();
      } catch {
        return EMPTY_TODAY;
      }
    },
  });
}

export function useWeeklyStats() {
  return useQuery({
    queryKey: ["stats", "weekly"],
    queryFn: async (): Promise<WeeklyStats | null> => {
      try {
        return await getWeeklyStats();
      } catch {
        return null;
      }
    },
  });
}

export function useVaultStats() {
  return useQuery({
    queryKey: ["stats", "vaults"],
    queryFn: async (): Promise<VaultStat[]> => {
      try {
        return await getVaultStats();
      } catch {
        return [];
      }
    },
  });
}

export function useTopChannels() {
  return useQuery({
    queryKey: ["stats", "channels"],
    queryFn: async (): Promise<ChannelStat[]> => {
      try {
        return await getTopChannels();
      } catch {
        return [];
      }
    },
  });
}

export function useImpactScore() {
  return useQuery({
    queryKey: ["stats", "impact"],
    queryFn: async (): Promise<number> => {
      try {
        return await getImpactScore();
      } catch {
        return 0;
      }
    },
  });
}
