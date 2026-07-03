"use client";

import { Trash2 } from "lucide-react";
import { useVideoNotes, useDeleteNote } from "@/lib/hooks/useNotes";
import { formatTimestamp } from "@/lib/utils/time";
import type { Video } from "@/lib/types";

interface NotesPanelProps {
  video: Video;
  onSeekTo?: (seconds: number) => void;
  /** Kept for call-site clarity; this component is always list-only now. */
  listOnly?: boolean;
}

/** Read-only list of timestamped notes for the active video. */
export function NotesPanel({ video, onSeekTo }: NotesPanelProps) {
  const { data: notes = [] } = useVideoNotes(video.id);
  const deleteNote = useDeleteNote();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-medium text-text-primary">
        Notes prises
      </h3>
      {notes.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          Aucune note pour cette vidéo.
        </p>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className="group flex items-start gap-2 rounded-md border border-border-light bg-surface-card p-2"
          >
            {note.timestamp_seconds != null ? (
              <button
                type="button"
                onClick={() => onSeekTo?.(note.timestamp_seconds ?? 0)}
                className="shrink-0 rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs text-accent nums-tabular transition-colors hover:bg-accent/10"
              >
                {formatTimestamp(note.timestamp_seconds)}
              </button>
            ) : null}
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-text-primary">
              {note.content}
            </p>
            <button
              type="button"
              onClick={() => deleteNote.mutate(note.id)}
              aria-label="Supprimer la note"
              className="shrink-0 text-text-tertiary opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
