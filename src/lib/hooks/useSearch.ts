"use client";

import { useQuery } from "@tanstack/react-query";
import { globalSearch, type SearchResults } from "@/lib/actions/search";

const EMPTY: SearchResults = { videos: [], notes: [], actions: [], vaults: [] };

/** Debounced global search. Pass the live query; results update as you type. */
export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query.trim()],
    enabled: query.trim().length >= 2,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<SearchResults> => {
      try {
        return await globalSearch(query);
      } catch {
        return EMPTY;
      }
    },
  });
}
