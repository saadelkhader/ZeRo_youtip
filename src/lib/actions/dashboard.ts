"use server";

import { createClient } from "@/lib/supabase/server";
import type { Action, Video } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export interface DashboardData {
  resumeVideo: Video | null;
  nextAction:
    | (Pick<Action, "id" | "title" | "estimated_minutes" | "vault_id"> & {
        vault: { title: string; icon: string } | null;
      })
    | null;
  queuePreview: Video[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { supabase, userId } = await requireUser();

  const [resume, action, queue] = await Promise.all([
    // Most recently touched, partially-listened, not completed.
    supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .gt("listened_seconds", 0)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Highest-priority open action ("now" due soonest), with vault context.
    supabase
      .from("actions")
      .select(
        "id, title, estimated_minutes, vault_id, vault:vaults(title, icon)",
      )
      .eq("user_id", userId)
      .in("status", ["todo", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Next few queued items.
    supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["inbox", "queued"])
      .order("position_in_queue", { ascending: true })
      .limit(3),
  ]);

  return {
    resumeVideo: (resume.data as Video) ?? null,
    nextAction:
      (action.data as DashboardData["nextAction"] | null) ?? null,
    queuePreview: (queue.data ?? []) as Video[],
  };
}
