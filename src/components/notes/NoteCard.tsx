"use client";

import * as React from "react";
import {
  Star,
  Copy,
  Zap,
  Trash2,
  MoreHorizontal,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useToggleFavorite,
  useConvertToAction,
  useDeleteNote,
} from "@/lib/hooks/useNotes";
import { formatTimestamp } from "@/lib/utils/time";
import type { NoteImportance } from "@/lib/types";
import type { NoteWithVideo } from "@/lib/actions/notes";
import { cn } from "@/lib/utils/cn";

const IMPORTANCE_DOT: Record<NoteImportance, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-error",
};

interface NoteCardProps {
  note: NoteWithVideo;
}

export function NoteCard({ note }: NoteCardProps) {
  const toggleFavorite = useToggleFavorite();
  const convertToAction = useConvertToAction();
  const deleteNote = useDeleteNote();

  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [converted, setConverted] = React.useState(false);

  function copy() {
    void navigator.clipboard?.writeText(note.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function convert() {
    convertToAction.mutate(note.id, {
      onSuccess: () => {
        setConverted(true);
        setTimeout(() => setConverted(false), 1500);
      },
    });
  }

  const long = note.content.length > 220;

  return (
    <div className="group relative rounded-lg border border-border-light bg-surface-card p-4 shadow-soft transition-shadow duration-150 hover:shadow-card">
      <div className="flex items-start gap-3">
        {/* Importance dot */}
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            IMPORTANCE_DOT[note.importance],
          )}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {note.timestamp_seconds != null ? (
              <span className="font-mono text-sm text-accent nums-tabular">
                {formatTimestamp(note.timestamp_seconds)}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "whitespace-pre-wrap break-words text-sm text-text-primary",
              !expanded && long && "line-clamp-3",
            )}
          >
            {note.content}
          </p>
          {long ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-xs text-accent hover:underline"
            >
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          ) : null}

          {note.video ? (
            <p className="mt-2 truncate text-xs text-text-secondary">
              Vidéo → {note.video.title}
            </p>
          ) : null}

          {(note.tags ?? []).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-tertiary"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Favorite star */}
        <button
          type="button"
          onClick={() => toggleFavorite.mutate(note.id)}
          aria-label={note.is_favorite ? "Retirer des favoris" : "Favori"}
          className={cn(
            "shrink-0 transition-opacity",
            note.is_favorite
              ? "text-warning opacity-100"
              : "text-text-tertiary opacity-0 hover:text-warning group-hover:opacity-100",
          )}
        >
          <Star
            className="h-4 w-4"
            fill={note.is_favorite ? "currentColor" : "none"}
          />
        </button>

        {/* Hover actions */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Options de la note"
            className="shrink-0 text-text-tertiary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copié" : "Copier"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={convert}>
              {converted ? <Check /> : <Zap />}
              {converted ? "Action créée" : "Transformer en action"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => deleteNote.mutate(note.id)}
            >
              <Trash2 />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
