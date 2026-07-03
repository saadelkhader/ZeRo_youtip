"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  buildThumbnailUrl,
  buildWatchUrl,
  fetchYoutubeOEmbed,
} from "@/lib/utils/youtube";
import type { Video, VideoPriority, VideoStatus } from "@/lib/types";

export interface AddVideoInput {
  youtube_id: string;
  title: string;
  channel_name?: string | null;
  duration_seconds?: number | null;
  thumbnail_url?: string | null;
  youtube_url: string;
  vault_id?: string | null;
  priority?: VideoPriority;
  intention?: string | null;
  status?: VideoStatus;
}

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export async function addVideo(input: AddVideoInput): Promise<Video> {
  const { supabase, userId } = await requireUserId();

  // Place new queue items at the end of their vault scope.
  const { count } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data, error } = await supabase
    .from("videos")
    .insert({
      user_id: userId,
      youtube_id: input.youtube_id,
      title: input.title,
      channel_name: input.channel_name ?? null,
      duration_seconds: input.duration_seconds ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      youtube_url: input.youtube_url,
      vault_id: input.vault_id ?? null,
      priority: input.priority ?? "this_week",
      intention: input.intention?.trim() || null,
      status: input.status ?? "queued",
      position_in_queue: count ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/queue");
  revalidatePath("/");
  return data as Video;
}

export async function updateVideo(
  id: string,
  data: Partial<
    Pick<
      Video,
      | "vault_id"
      | "priority"
      | "status"
      | "intention"
      | "expected_result"
      | "max_duration_minutes"
      | "listened_seconds"
      | "is_completed"
      | "position_in_queue"
    >
  >,
): Promise<Video> {
  const { supabase } = await requireUserId();
  const { data: updated, error } = await supabase
    .from("videos")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/queue");
  return updated as Video;
}

export async function deleteVideo(id: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/queue");
}

export async function moveVideoToVault(
  videoId: string,
  vaultId: string | null,
): Promise<Video> {
  return updateVideo(videoId, { vault_id: vaultId });
}

/** Persist a new queue order by writing each video's index. */
export async function reorderQueue(videoIds: string[]): Promise<void> {
  const { supabase } = await requireUserId();
  await Promise.all(
    videoIds.map((id, index) =>
      supabase.from("videos").update({ position_in_queue: index }).eq("id", id),
    ),
  );
  revalidatePath("/queue");
}

/** Fetch a single video by its YouTube id (for direct /player links). */
export async function getVideoByYoutubeId(
  youtubeId: string,
): Promise<Video | null> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .eq("youtube_id", youtubeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Video) ?? null;
}

/**
 * Return the user's DB video for a YouTube id, creating it if missing. This
 * guarantees the player always has a real `videos.id` so notes, actions and
 * listening sessions can reference it (no synthetic stand-in).
 */
export async function ensureVideo(youtubeId: string): Promise<Video> {
  const { supabase, userId } = await requireUserId();

  const existing = await getVideoByYoutubeId(youtubeId);
  if (existing) return existing;

  // Resolve title/channel/thumbnail from the public oEmbed endpoint.
  const oembed = await fetchYoutubeOEmbed(youtubeId);

  const { data, error } = await supabase
    .from("videos")
    .insert({
      user_id: userId,
      youtube_id: youtubeId,
      title: oembed?.title ?? "Vidéo YouTube",
      channel_name: oembed?.author_name ?? null,
      thumbnail_url: buildThumbnailUrl(youtubeId, "hqdefault"),
      youtube_url: buildWatchUrl(youtubeId),
      status: "playing",
      priority: "now",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/queue");
  return data as Video;
}

/**
 * Queue for the dashboard, optionally scoped to a vault. Excludes completed /
 * archived items, ordered by priority then queue position.
 */
export async function getQueueByVault(
  vaultId?: string | null,
): Promise<Video[]> {
  const { supabase, userId } = await requireUserId();

  let query = supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["inbox", "queued", "playing"]);

  if (vaultId) query = query.eq("vault_id", vaultId);

  const { data, error } = await query
    .order("position_in_queue", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Video[];
}

/** All videos in a vault (any status except archived), newest first. */
export async function getVideosByVault(vaultId: string): Promise<Video[]> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .eq("vault_id", vaultId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Video[];
}
