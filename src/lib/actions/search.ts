"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResultType = "video" | "note" | "action" | "vault";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  /** Route to navigate to on selection. */
  href: string;
}

export interface SearchResults {
  videos: SearchResult[];
  notes: SearchResult[];
  actions: SearchResult[];
  vaults: SearchResult[];
}

const EMPTY: SearchResults = { videos: [], notes: [], actions: [], vaults: [] };

/**
 * Global search across the user's content via case-insensitive `ilike`.
 * Returns up to 5 matches per category. Empty/failed queries return nothing.
 */
export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const userId = user.id;
  const pattern = `%${q}%`;

  const [videos, notes, actions, vaults] = await Promise.all([
    supabase
      .from("videos")
      .select("id, title, channel_name, youtube_id")
      .eq("user_id", userId)
      .ilike("title", pattern)
      .limit(5),
    supabase
      .from("notes")
      .select("id, content, video_id, video:videos(title)")
      .eq("user_id", userId)
      .ilike("content", pattern)
      .limit(5),
    supabase
      .from("actions")
      .select("id, title, description")
      .eq("user_id", userId)
      .ilike("title", pattern)
      .limit(5),
    supabase
      .from("vaults")
      .select("id, title, description")
      .eq("user_id", userId)
      .ilike("title", pattern)
      .limit(5),
  ]);

  return {
    videos: (videos.data ?? []).map((v) => ({
      type: "video" as const,
      id: v.id,
      title: v.title,
      subtitle: v.channel_name ?? "",
      href: `/player/${v.youtube_id}`,
    })),
    notes: (notes.data ?? []).map((n) => {
      const video = n.video as { title?: string } | { title?: string }[] | null;
      const videoTitle = Array.isArray(video) ? video[0]?.title : video?.title;
      return {
        type: "note" as const,
        id: n.id,
        title: n.content,
        subtitle: videoTitle ? `Note · ${videoTitle}` : "Note",
        href: "/notes",
      };
    }),
    actions: (actions.data ?? []).map((a) => ({
      type: "action" as const,
      id: a.id,
      title: a.title,
      subtitle: a.description ?? "Action",
      href: "/actions",
    })),
    vaults: (vaults.data ?? []).map((v) => ({
      type: "vault" as const,
      id: v.id,
      title: v.title,
      subtitle: v.description ?? "Vault",
      href: `/vaults/${v.id}`,
    })),
  };
}
