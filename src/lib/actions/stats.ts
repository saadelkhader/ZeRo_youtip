"use server";

import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Local-time yyyy-mm-dd key (avoids UTC slicing bugs across timezones). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Today ─────────────────────────────────────────────────────
export interface TodayStats {
  secondsListened: number;
  videosCompleted: number;
  notesCreated: number;
  actionsCreated: number;
  actionsCompleted: number;
}

export async function getTodayStats(): Promise<TodayStats> {
  const { supabase, userId } = await requireUser();
  const since = startOfToday().toISOString();

  const [sessions, notes, actionsCreated, actionsDone, videos] =
    await Promise.all([
      supabase
        .from("listening_sessions")
        .select("seconds_listened")
        .eq("user_id", userId)
        .gte("started_at", since),
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since),
      supabase
        .from("actions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since),
      supabase
        .from("actions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "done")
        .gte("created_at", since),
      supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true)
        .gte("updated_at", since),
    ]);

  const secondsListened = (sessions.data ?? []).reduce(
    (sum, s) => sum + (s.seconds_listened ?? 0),
    0,
  );

  return {
    secondsListened,
    videosCompleted: videos.count ?? 0,
    notesCreated: notes.count ?? 0,
    actionsCreated: actionsCreated.count ?? 0,
    actionsCompleted: actionsDone.count ?? 0,
  };
}

// ── Weekly (7-day bars + last-week comparison) ────────────────
export interface DayBucket {
  date: string; // ISO date (yyyy-mm-dd)
  label: string; // "Lun", "Mar"…
  seconds: number;
  lastWeekSeconds: number;
}

export interface WeeklyStats {
  days: DayBucket[];
  totalSeconds: number;
  videosCompleted: number;
  notesCreated: number;
  actionExecutionPct: number;
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const { supabase, userId } = await requireUser();

  const today = startOfToday();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6); // last 7 days incl. today
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);

  const [sessions, notes, videos, actionsAll, actionsDone] = await Promise.all([
    supabase
      .from("listening_sessions")
      .select("seconds_listened, started_at")
      .eq("user_id", userId)
      .gte("started_at", twoWeeksAgo.toISOString()),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true)
      .gte("updated_at", weekAgo.toISOString()),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("created_at", weekAgo.toISOString()),
  ]);

  // Bucket sessions by LOCAL day for this week and the prior week.
  const buckets: DayBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    buckets.push({
      date: localDateKey(d),
      label: DAY_LABELS[d.getDay()],
      seconds: 0,
      lastWeekSeconds: 0,
    });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));

  for (const s of sessions.data ?? []) {
    const d = new Date(s.started_at as string);
    const key = localDateKey(d);
    const thisWeek = byDate.get(key);
    if (thisWeek) {
      thisWeek.seconds += s.seconds_listened ?? 0;
      continue;
    }
    // Map a prior-week day onto its same weekday slot for the ghost bars.
    const shifted = new Date(d);
    shifted.setDate(shifted.getDate() + 7);
    const ghost = byDate.get(localDateKey(shifted));
    if (ghost) ghost.lastWeekSeconds += s.seconds_listened ?? 0;
  }

  const totalSeconds = buckets.reduce((sum, b) => sum + b.seconds, 0);
  const totalActions = actionsAll.count ?? 0;
  const doneActions = actionsDone.count ?? 0;

  return {
    days: buckets,
    totalSeconds,
    videosCompleted: videos.count ?? 0,
    notesCreated: notes.count ?? 0,
    actionExecutionPct:
      totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0,
  };
}

// ── Impact score (0-100) ──────────────────────────────────────
export async function getImpactScore(): Promise<number> {
  const { supabase, userId } = await requireUser();
  const weekAgo = startOfToday();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const since = weekAgo.toISOString();

  const [actionsDone, notesHigh, videosDone] = await Promise.all([
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("created_at", since),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("importance", "high")
      .gte("created_at", since),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true)
      .gte("updated_at", since),
  ]);

  // Weighted, then squashed into 0-100 (saturates around ~10 weighted units).
  const raw =
    (actionsDone.count ?? 0) * 0.5 +
    (notesHigh.count ?? 0) * 0.3 +
    (videosDone.count ?? 0) * 0.2;
  return Math.min(100, Math.round((raw / 10) * 100));
}

// ── Per-vault stats ───────────────────────────────────────────
export interface VaultStat {
  vaultId: string | null;
  title: string;
  icon: string;
  color: string;
  videoCount: number;
  actionCount: number;
  secondsListened: number;
}

export async function getVaultStats(): Promise<VaultStat[]> {
  const { supabase, userId } = await requireUser();

  const [vaults, videos, actions, sessions] = await Promise.all([
    supabase
      .from("vaults")
      .select("id, title, icon, color")
      .eq("user_id", userId)
      .eq("is_archived", false),
    supabase
      .from("videos")
      .select("id, vault_id, listened_seconds")
      .eq("user_id", userId),
    supabase.from("actions").select("vault_id").eq("user_id", userId),
    supabase
      .from("listening_sessions")
      .select("seconds_listened, video_id")
      .eq("user_id", userId),
  ]);

  const videoVault = new Map<string, string | null>();
  const secondsByVault = new Map<string | null, number>();
  for (const v of videos.data ?? []) {
    videoVault.set(v.id, v.vault_id);
    secondsByVault.set(
      v.vault_id,
      (secondsByVault.get(v.vault_id) ?? 0) + (v.listened_seconds ?? 0),
    );
  }

  const videoCountByVault = new Map<string | null, number>();
  for (const v of videos.data ?? [])
    videoCountByVault.set(
      v.vault_id,
      (videoCountByVault.get(v.vault_id) ?? 0) + 1,
    );

  const actionCountByVault = new Map<string | null, number>();
  for (const a of actions.data ?? [])
    actionCountByVault.set(
      a.vault_id,
      (actionCountByVault.get(a.vault_id) ?? 0) + 1,
    );

  const stats: VaultStat[] = (vaults.data ?? []).map((v) => ({
    vaultId: v.id,
    title: v.title,
    icon: v.icon,
    color: v.color,
    videoCount: videoCountByVault.get(v.id) ?? 0,
    actionCount: actionCountByVault.get(v.id) ?? 0,
    secondsListened: secondsByVault.get(v.id) ?? 0,
  }));

  return stats.sort((a, b) => b.secondsListened - a.secondsListened);
}

// ── Top channels (by notes-per-video usefulness) ──────────────
export interface ChannelStat {
  channel: string;
  videoCount: number;
  secondsListened: number;
  noteCount: number;
}

export async function getTopChannels(): Promise<ChannelStat[]> {
  const { supabase, userId } = await requireUser();

  const [videos, notes] = await Promise.all([
    supabase
      .from("videos")
      .select("id, channel_name, listened_seconds")
      .eq("user_id", userId),
    supabase.from("notes").select("video_id").eq("user_id", userId),
  ]);

  const notesByVideo = new Map<string, number>();
  for (const n of notes.data ?? [])
    if (n.video_id)
      notesByVideo.set(n.video_id, (notesByVideo.get(n.video_id) ?? 0) + 1);

  const byChannel = new Map<string, ChannelStat>();
  for (const v of videos.data ?? []) {
    const name = (v.channel_name as string) || "Inconnu";
    const entry =
      byChannel.get(name) ??
      ({
        channel: name,
        videoCount: 0,
        secondsListened: 0,
        noteCount: 0,
      } as ChannelStat);
    entry.videoCount += 1;
    entry.secondsListened += v.listened_seconds ?? 0;
    entry.noteCount += notesByVideo.get(v.id) ?? 0;
    byChannel.set(name, entry);
  }

  return [...byChannel.values()]
    .sort((a, b) => b.noteCount / b.videoCount - a.noteCount / a.videoCount)
    .slice(0, 5);
}
