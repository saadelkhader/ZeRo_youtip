"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NextActionDialog } from "@/components/shared/NextActionDialog";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useVideoNotes } from "@/lib/hooks/useNotes";
import { formatDuration, formatTimestamp } from "@/lib/utils/time";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Rating = "very_helpful" | "helpful" | "not_really" | "waste";

const RATINGS: { value: Rating; label: string }[] = [
  { value: "very_helpful", label: "Oui beaucoup" },
  { value: "helpful", label: "Oui un peu" },
  { value: "not_really", label: "Pas vraiment" },
  { value: "waste", label: "Perte de temps" },
];

interface VideoEndScreenProps {
  video: Video;
  /** Called with the chosen rating so the session can be closed/recorded. */
  onRate?: (rating: Rating) => void;
  onAddNote?: () => void;
}

/** Calm closing screen shown when a video finishes (or is marked done). */
export function VideoEndScreen({
  video,
  onRate,
  onAddNote,
}: VideoEndScreenProps) {
  const router = useRouter();
  const sessionSeconds = usePlayerStore((s) => s.sessionSeconds);
  const stopVideo = usePlayerStore((s) => s.stopVideo);
  const { data: notes = [] } = useVideoNotes(video.id);

  const [rating, setRating] = React.useState<Rating | null>(null);
  const [actionOpen, setActionOpen] = React.useState(false);

  function goHome() {
    stopVideo();
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-medium text-text-primary">
          Tu as terminé cette écoute.
        </h1>
        <p className="mt-2 line-clamp-2 text-base text-text-secondary">
          {video.title}
        </p>
        <p className="mt-1 font-mono text-sm text-text-tertiary nums-tabular">
          {formatDuration(sessionSeconds)} écoutées
        </p>

        {/* Rating */}
        <div className="mt-8">
          <p className="mb-3 text-sm text-text-secondary">
            Est-ce que cette écoute t&apos;a aidé ?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  setRating(r.value);
                  onRate?.(r.value);
                }}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  rating === r.value
                    ? "border-accent bg-accent/[0.08] font-medium text-accent"
                    : "border-border-light text-text-secondary hover:bg-surface-secondary",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes recap */}
        <div className="mt-8 text-left">
          <p className="mb-2 text-sm text-text-secondary">Que retiens-tu ?</p>
          {notes.length === 0 ? (
            <button
              type="button"
              onClick={onAddNote}
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <NotebookPen className="h-4 w-4" />
              Ajouter une note maintenant
            </button>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {notes.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 rounded-md bg-surface-secondary/50 px-2.5 py-1.5 text-sm"
                >
                  {n.timestamp_seconds != null ? (
                    <span className="shrink-0 font-mono text-xs text-accent nums-tabular">
                      {formatTimestamp(n.timestamp_seconds)}
                    </span>
                  ) : null}
                  <span className="text-text-primary">{n.content}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Next action */}
        <div className="mt-8">
          <p className="mb-3 text-sm text-text-secondary">
            Prochaine action correcte ?
          </p>
          <Button
            variant="outline"
            onClick={() => setActionOpen(true)}
            className="w-full"
          >
            <Zap className="h-4 w-4" />
            Définir une action
          </Button>
        </div>

        <Button onClick={goHome} className="mt-6 w-full">
          Retourner à l&apos;accueil
        </Button>

        <p className="mt-6 text-sm italic text-text-secondary">
          Retourne maintenant à ce qui compte.
        </p>
      </div>

      <NextActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        videoId={video.id}
        defaultVaultId={video.vault_id}
      />
    </div>
  );
}
