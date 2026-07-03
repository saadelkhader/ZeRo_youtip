"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Action, ActionStatus, Vault, Video } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export interface CreateActionInput {
  title: string;
  description?: string | null;
  video_id?: string | null;
  vault_id?: string | null;
  note_id?: string | null;
  estimated_minutes?: number | null;
  due_date?: string | null;
}

/** An action joined with light vault + video context for the Actions page. */
export interface ActionWithContext extends Action {
  vault: Pick<Vault, "id" | "title" | "icon" | "color"> | null;
  video: Pick<Video, "id" | "title" | "youtube_id"> | null;
}

export async function getActions(): Promise<ActionWithContext[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("actions")
    .select(
      "*, vault:vaults(id, title, icon, color), video:videos(id, title, youtube_id)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ActionWithContext[];
}

export async function getActionsForVideo(videoId: string): Promise<Action[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Action[];
}

export async function createAction(input: CreateActionInput): Promise<Action> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("actions")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      video_id: input.video_id ?? null,
      vault_id: input.vault_id ?? null,
      note_id: input.note_id ?? null,
      estimated_minutes: input.estimated_minutes ?? null,
      due_date: input.due_date ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/actions");
  return data as Action;
}

export interface UpdateActionInput {
  title?: string;
  description?: string | null;
  vault_id?: string | null;
  estimated_minutes?: number | null;
  due_date?: string | null;
  status?: ActionStatus;
}

export async function updateAction(
  id: string,
  input: UpdateActionInput,
): Promise<Action> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("actions")
    .update({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.vault_id !== undefined ? { vault_id: input.vault_id } : {}),
      ...(input.estimated_minutes !== undefined
        ? { estimated_minutes: input.estimated_minutes }
        : {}),
      ...(input.due_date !== undefined ? { due_date: input.due_date } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/actions");
  return data as Action;
}

export async function updateActionStatus(
  id: string,
  status: ActionStatus,
): Promise<Action> {
  return updateAction(id, { status });
}

export async function deleteAction(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("actions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/actions");
}

/** Actions due today (local-day boundaries computed on the server). */
export async function getDailyActions(): Promise<ActionWithContext[]> {
  const { supabase, userId } = await requireUser();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from("actions")
    .select(
      "*, vault:vaults(id, title, icon, color), video:videos(id, title, youtube_id)",
    )
    .eq("user_id", userId)
    .gte("due_date", start.toISOString())
    .lt("due_date", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ActionWithContext[];
}
