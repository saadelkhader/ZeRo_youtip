"use server";

import { createClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export interface HistoryFilters {
  range?: "today" | "7d" | "30d" | "all";
  vaultId?: string | null;
  status?: "completed" | "partial" | "all";
  withNotes?: boolean;
  withActions?: boolean;
  page?: number;
}

export interface HistoryItem {
  sessionId: string;
  startedAt: string;
  secondsListened: number;
  video: Pick<
    Video,
    | "id"
    | "title"
    | "channel_name"
    | "youtube_id"
    | "thumbnail_url"
    | "vault_id"
    | "is_completed"
  > | null;
  vault: { id: string; title: string; icon: string; color: string } | null;
  noteCount: number;
  hasAction: boolean;
}

const PAGE_SIZE = 10;

function rangeStart(range: HistoryFilters["range"]): string | null {
  if (!range || range === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d.toISOString();
  if (range === "7d") d.setDate(d.getDate() - 6);
  if (range === "30d") d.setDate(d.getDate() - 29);
  return d.toISOString();
}

export async function getHistory(
  filters: HistoryFilters = {},
): Promise<{ items: HistoryItem[]; hasMore: boolean }> {
  const { supabase, userId } = await requireUser();
  const page = filters.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra to detect hasMore

  let query = supabase
    .from("listening_sessions")
    .select(
      "id, started_at, seconds_listened, video:videos(id, title, channel_name, youtube_id, thumbnail_url, vault_id, is_completed, vault:vaults(id, title, icon, color))",
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(from, to);

  const since = rangeStart(filters.range);
  if (since) query = query.gte("started_at", since);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as unknown as Array<{
    id: string;
    started_at: string;
    seconds_listened: number | null;
    video: (HistoryItem["video"] & {
      vault: HistoryItem["vault"];
    }) | null;
  }>;

  const hasMore = rows.length > PAGE_SIZE;
  rows = rows.slice(0, PAGE_SIZE);

  // Note / action presence per video (small N per page).
  const videoIds = rows.map((r) => r.video?.id).filter(Boolean) as string[];
  const [{ data: notes }, { data: actions }] = await Promise.all([
    videoIds.length
      ? supabase
          .from("notes")
          .select("video_id")
          .eq("user_id", userId)
          .in("video_id", videoIds)
      : Promise.resolve({ data: [] as { video_id: string }[] }),
    videoIds.length
      ? supabase
          .from("actions")
          .select("video_id")
          .eq("user_id", userId)
          .in("video_id", videoIds)
      : Promise.resolve({ data: [] as { video_id: string }[] }),
  ]);

  const noteCounts = new Map<string, number>();
  for (const n of notes ?? [])
    if (n.video_id)
      noteCounts.set(n.video_id, (noteCounts.get(n.video_id) ?? 0) + 1);
  const actionSet = new Set((actions ?? []).map((a) => a.video_id));

  let items: HistoryItem[] = rows.map((r) => {
    const v = r.video;
    return {
      sessionId: r.id,
      startedAt: r.started_at,
      secondsListened: r.seconds_listened ?? 0,
      video: v
        ? {
            id: v.id,
            title: v.title,
            channel_name: v.channel_name,
            youtube_id: v.youtube_id,
            thumbnail_url: v.thumbnail_url,
            vault_id: v.vault_id,
            is_completed: v.is_completed,
          }
        : null,
      vault: v?.vault ?? null,
      noteCount: v ? (noteCounts.get(v.id) ?? 0) : 0,
      hasAction: v ? actionSet.has(v.id) : false,
    };
  });

  // In-memory filters (kept simple; the page sizes are small).
  if (filters.vaultId)
    items = items.filter((i) => i.video?.vault_id === filters.vaultId);
  if (filters.status === "completed")
    items = items.filter((i) => i.video?.is_completed);
  if (filters.status === "partial")
    items = items.filter((i) => i.video && !i.video.is_completed);
  if (filters.withNotes) items = items.filter((i) => i.noteCount > 0);
  if (filters.withActions) items = items.filter((i) => i.hasAction);

  return { items, hasMore };
}
