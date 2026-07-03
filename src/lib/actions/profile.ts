"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, user };
}

import type { AccountStatus, UserRole } from "@/lib/types";

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  daily_limit_minutes: number;
  default_speed: number;
  reflection_pause_minutes: number;
  single_video_mode: boolean;
  screen_free_mode: boolean;
  dark_mode: boolean;
  role: UserRole;
  account_status: AccountStatus;
}

export async function getProfile(): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return { ...(data as Omit<Profile, "email">), email: user.email ?? "" };
}

export interface UpdateProfileInput {
  name?: string;
  daily_limit_minutes?: number;
  default_speed?: number;
  reflection_pause_minutes?: number;
  single_video_mode?: boolean;
  screen_free_mode?: boolean;
}

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

/**
 * Delete the user's data (profile row cascades to vaults/videos/notes/…),
 * then sign out. Removing the auth.users record itself requires a service-role
 * key, so that final step is left to a server with admin privileges.
 */
export async function deleteAccount(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/login");
}

/** Export all of the user's content as a single JSON document. */
export async function exportAllData(): Promise<string> {
  const { supabase, user } = await requireUser();

  const [profile, vaults, videos, notes, actions, sessions] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("vaults").select("*").eq("user_id", user.id),
      supabase.from("videos").select("*").eq("user_id", user.id),
      supabase.from("notes").select("*").eq("user_id", user.id),
      supabase.from("actions").select("*").eq("user_id", user.id),
      supabase
        .from("listening_sessions")
        .select("*")
        .eq("user_id", user.id),
    ]);

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      vaults: vaults.data ?? [],
      videos: videos.data ?? [],
      notes: notes.data ?? [],
      actions: actions.data ?? [],
      sessions: sessions.data ?? [],
    },
    null,
    2,
  );
}
