"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addNote,
  convertToAction,
  deleteNote,
  getAllNotes,
  getNotesForVideo,
  toggleFavorite,
  updateNote,
  type AddNoteInput,
  type NoteWithVideo,
  type UpdateNoteInput,
} from "@/lib/actions/notes";
import type { Note } from "@/lib/types";
import { toast } from "@/lib/toast";

const videoNotesKey = (videoId: string) => ["notes", "video", videoId] as const;
const ALL_KEY = ["notes", "all"] as const;

export function useVideoNotes(videoId: string | null) {
  return useQuery({
    queryKey: videoNotesKey(videoId ?? "none"),
    enabled: Boolean(videoId),
    queryFn: async (): Promise<Note[]> => {
      if (!videoId) return [];
      try {
        return await getNotesForVideo(videoId);
      } catch {
        return [];
      }
    },
  });
}

export function useAllNotes() {
  return useQuery({
    queryKey: ALL_KEY,
    queryFn: async (): Promise<NoteWithVideo[]> => {
      try {
        return await getAllNotes();
      } catch {
        return [];
      }
    },
  });
}

function invalidateNotes(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["notes"] });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddNoteInput) => addNote(input),
    onSuccess: () => {
      invalidateNotes(qc);
      toast.noteSaved();
    },
    onError: (err) =>
      toast.info(
        err instanceof Error ? err.message : "Sauvegarde impossible.",
      ),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      updateNote(id, input),
    onSuccess: () => invalidateNotes(qc),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleFavorite(id),
    onSuccess: () => invalidateNotes(qc),
  });
}

export function useConvertToAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => convertToAction(noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions"] });
      toast.actionCreated();
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => invalidateNotes(qc),
  });
}
