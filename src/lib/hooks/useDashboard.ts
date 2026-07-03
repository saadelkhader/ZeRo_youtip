"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard, type DashboardData } from "@/lib/actions/dashboard";

const EMPTY: DashboardData = {
  resumeVideo: null,
  nextAction: null,
  queuePreview: [],
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      try {
        return await getDashboard();
      } catch {
        return EMPTY;
      }
    },
  });
}
