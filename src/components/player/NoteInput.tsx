"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useAddNote } from "@/lib/hooks/useNotes";
import { formatTimestamp } from "@/lib/utils/time";
import type { NoteImportance, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const IMPORTANCE: { value: NoteImportance; label: string; color: string }[] = [
  { value: "low", label: "Faible", color: "bg-success" },
  { value: "medium", label: "Moyenne", color: "bg-warning" },
  { value: "high", label: "Haute", color: "bg-error" },
];

interface NoteInputProps {
  video: Video;
  recentTags?: string[];
}

/**
 * Quick note capture for the player. Auto-resizing textarea (2→6 lines),
 * tag chips, importance selector, Ctrl+Enter to save. Captures the playback
 * timestamp at the moment of saving.
 */
export const NoteInput = React.forwardRef<HTMLTextAreaElement, NoteInputProps>(
  function NoteInput({ video, recentTags = [] }, ref) {
    const currentTime = usePlayerStore((s) => s.currentTime);
    const addNote = useAddNote();

    const [content, setContent] = React.useState("");
    const [tags, setTags] = React.useState<string[]>([]);
    const [tagDraft, setTagDraft] = React.useState("");
    const [importance, setImportance] = React.useState<NoteImportance>("medium");

    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    // Auto-resize between ~2 and ~6 lines.
    React.useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      const max = 6 * 22 + 16; // ~6 lines
      el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    }, [content]);

    function addTag(tag: string) {
      const t = tag.trim().replace(/^#/, "");
      if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
      setTagDraft("");
    }

    function save() {
      const text = content.trim();
      if (!text) return;
      addNote.mutate({
        video_id: video.id,
        vault_id: video.vault_id,
        content: text,
        timestamp_seconds: Math.floor(currentTime),
        importance,
        tags,
      });
      setContent("");
      setTags([]);
      setImportance("medium");
    }

    const ts = formatTimestamp(currentTime);

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-text-primary">
            Note rapide
          </h3>
          <span className="font-mono text-sm text-accent nums-tabular">
            {ts}
          </span>
        </div>

        <textarea
          ref={setRefs}
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          placeholder={`Note rapide... (timestamp : ${ts})`}
          className={cn(
            "w-full resize-none rounded-md border border-border-strong bg-surface-card px-3 py-2 text-base text-text-primary shadow-soft transition-colors",
            "placeholder:text-text-tertiary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          )}
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary"
            >
              #{t}
              <button
                type="button"
                onClick={() => setTags((p) => p.filter((x) => x !== t))}
                aria-label={`Retirer ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagDraft);
              }
            }}
            placeholder="+ tag"
            className="w-20 bg-transparent text-xs text-text-secondary placeholder:text-text-tertiary focus:outline-none"
          />
          {recentTags
            .filter((t) => !tags.includes(t))
            .slice(0, 4)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="rounded-full border border-border-light px-2 py-0.5 text-xs text-text-tertiary transition-colors hover:border-accent/40 hover:text-accent"
              >
                #{t}
              </button>
            ))}
        </div>

        <div className="flex items-center justify-between">
          {/* Importance */}
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1.5">
              {IMPORTANCE.map((imp) => (
                <Tooltip key={imp.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setImportance(imp.value)}
                      aria-label={`Importance ${imp.label}`}
                      aria-pressed={importance === imp.value}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                        importance === imp.value
                          ? "border-text-primary"
                          : "border-transparent opacity-50 hover:opacity-100",
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", imp.color)} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{imp.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <Button
            size="sm"
            onClick={save}
            disabled={content.trim().length === 0 || addNote.isPending}
          >
            <Plus className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>
    );
  },
);
