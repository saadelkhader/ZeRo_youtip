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

/** Begin a listening session, returning its id for subsequent progress writes. */
export async function startSession(videoId: string): Promise<string> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("listening_sessions")
    .insert({
      user_id: userId,
      video_id: videoId,
      started_at: new Date().toISOString(),
      seconds_listened: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * Persist progress (called ~every 10s). Updates the session's listened total
 * and mirrors the position onto the video so resume works across reloads.
 */
export async function updateListenedTime(
  sessionId: string,
  videoId: string,
  secondsListened: number,
  positionSeconds: number,
): Promise<void> {
  const { supabase } = await requireUser();

  await Promise.all([
    supabase
      .from("listening_sessions")
      .update({ seconds_listened: secondsListened })
      .eq("id", sessionId),
    supabase
      .from("videos")
      .update({ listened_seconds: Math.floor(positionSeconds) })
      .eq("id", videoId),
  ]);
}

/** Close a session, recording end time and an optional intention rating. */
export async function endSession(
  sessionId: string,
  secondsListened: number,
  rating?: "very_helpful" | "helpful" | "not_really" | "waste",
): Promise<void> {
  const { supabase } = await requireUser();
  await supabase
    .from("listening_sessions")
    .update({
      ended_at: new Date().toISOString(),
      seconds_listened: secondsListened,
      ...(rating ? { intention_rating: rating } : {}),
    })
    .eq("id", sessionId);
}

export interface TodayStats {
  listenedSeconds: number;
  dailyLimitMinutes: number;
  reflectionPauseMinutes: number;
}

/** Aggregate today's listening + the user's preference settings. */
export async function getTodayStats(): Promise<TodayStats> {
  const { supabase, userId } = await requireUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from("listening_sessions")
      .select("seconds_listened")
      .eq("user_id", userId)
      .gte("started_at", startOfDay.toISOString()),
    supabase
      .from("profiles")
      .select("daily_limit_minutes, reflection_pause_minutes")
      .eq("id", userId)
      .single(),
  ]);

  const listenedSeconds = (sessions ?? []).reduce(
    (sum, s) => sum + (s.seconds_listened ?? 0),
    0,
  );

  return {
    listenedSeconds,
    dailyLimitMinutes: profile?.daily_limit_minutes ?? 60,
    reflectionPauseMinutes: profile?.reflection_pause_minutes ?? 0,
  };
}
