"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getHistory,
  type HistoryFilters,
  type HistoryItem,
} from "@/lib/actions/history";

export function useHistory(filters: Omit<HistoryFilters, "page">) {
  return useInfiniteQuery({
    queryKey: ["history", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<{
      items: HistoryItem[];
      hasMore: boolean;
      page: number;
    }> => {
      try {
        const res = await getHistory({ ...filters, page: pageParam });
        return { ...res, page: pageParam };
      } catch {
        return { items: [], hasMore: false, page: pageParam };
      }
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}
