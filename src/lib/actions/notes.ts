"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Action, Note, NoteImportance, Video } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export interface AddNoteInput {
  video_id: string;
  vault_id?: string | null;
  content: string;
  timestamp_seconds?: number | null;
  importance?: NoteImportance;
  tags?: string[];
}

export async function getNotesForVideo(videoId: string): Promise<Note[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .order("timestamp_seconds", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

/** A note joined with its source video title (for the global Notes page). */
export interface NoteWithVideo extends Note {
  video: Pick<Video, "id" | "title" | "channel_name" | "youtube_id"> | null;
}

export async function getAllNotes(): Promise<NoteWithVideo[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .select("*, video:videos(id, title, channel_name, youtube_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as NoteWithVideo[];
}

export async function addNote(input: AddNoteInput): Promise<Note> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      video_id: input.video_id,
      vault_id: input.vault_id ?? null,
      content: input.content.trim(),
      timestamp_seconds: input.timestamp_seconds ?? null,
      importance: input.importance ?? "medium",
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data as Note;
}

/** Alias matching the spec naming. */
export async function createNote(input: AddNoteInput): Promise<Note> {
  return addNote(input);
}

export interface UpdateNoteInput {
  content?: string;
  importance?: NoteImportance;
  tags?: string[];
  is_favorite?: boolean;
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .update({
      ...(input.content !== undefined
        ? { content: input.content.trim() }
        : {}),
      ...(input.importance !== undefined
        ? { importance: input.importance }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.is_favorite !== undefined
        ? { is_favorite: input.is_favorite }
        : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data as Note;
}

export async function toggleFavorite(id: string): Promise<Note> {
  const { supabase } = await requireUser();
  const { data: current, error: readErr } = await supabase
    .from("notes")
    .select("is_favorite")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(readErr.message);

  const { data, error } = await supabase
    .from("notes")
    .update({ is_favorite: !current.is_favorite })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

/** Create an action seeded from a note, linked back to it. */
export async function convertToAction(noteId: string): Promise<Action> {
  const { supabase, userId } = await requireUser();

  const { data: note, error: noteErr } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();
  if (noteErr) throw new Error(noteErr.message);

  const content = (note.content as string) ?? "";
  const title = content.length > 80 ? `${content.slice(0, 77)}…` : content;

  const { data, error } = await supabase
    .from("actions")
    .insert({
      user_id: userId,
      note_id: noteId,
      video_id: note.video_id,
      vault_id: note.vault_id,
      title: title || "Action depuis une note",
      description: content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/actions");
  return data as Action;
}

/** Format the user's notes as Markdown or CSV for download. */
export async function exportNotes(format: "md" | "csv"): Promise<string> {
  const notes = await getAllNotes();

  if (format === "csv") {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["video", "channel", "timestamp_seconds", "importance", "tags", "content"]
        .map(escape)
        .join(","),
      ...notes.map((n) =>
        [
          n.video?.title ?? "",
          n.video?.channel_name ?? "",
          n.timestamp_seconds != null ? String(n.timestamp_seconds) : "",
          n.importance,
          (n.tags ?? []).join("; "),
          n.content,
        ]
          .map((v) => escape(String(v)))
          .join(","),
      ),
    ];
    return rows.join("\n");
  }

  // Markdown — grouped by source video.
  const byVideo = new Map<string, NoteWithVideo[]>();
  for (const n of notes) {
    const key = n.video?.title ?? "Sans vidéo";
    const list = byVideo.get(key) ?? [];
    list.push(n);
    byVideo.set(key, list);
  }

  const fmtTs = (s: number | null) => {
    if (s == null) return "";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `[${m}:${sec.toString().padStart(2, "0")}] `;
  };

  const sections: string[] = ["# Mes notes — ZeRo youtip", ""];
  for (const [title, list] of byVideo) {
    const channel = list[0]?.video?.channel_name;
    sections.push(`## ${title}`);
    if (channel) sections.push(`_${channel}_`);
    sections.push("");
    for (const n of list) {
      const tags = (n.tags ?? []).length
        ? ` _(${(n.tags ?? []).map((t) => `#${t}`).join(" ")})_`
        : "";
      sections.push(`- ${fmtTs(n.timestamp_seconds)}${n.content}${tags}`);
    }
    sections.push("");
  }
  return sections.join("\n");
}
