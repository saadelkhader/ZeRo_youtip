"use client";

import { NotebookPen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatDuration } from "@/lib/utils/time";

interface ReflectionPauseProps {
  onAddNote: () => void;
}

/**
 * Gentle, non-blocking reflection prompt. Appears on cadence (e.g. every
 * 20 min). Sits at the bottom; the rest of the UI stays usable.
 */
export function ReflectionPause({ onAddNote }: ReflectionPauseProps) {
  const reflectionDue = usePlayerStore((s) => s.reflectionDue);
  const sessionSeconds = usePlayerStore((s) => s.sessionSeconds);
  const dismissReflection = usePlayerStore((s) => s.dismissReflection);
  const resumeVideo = usePlayerStore((s) => s.resumeVideo);

  if (!reflectionDue) return null;

  function resume() {
    dismissReflection();
    resumeVideo();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 animate-slide-up">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-border-light bg-surface-card/95 p-4 shadow-elevated backdrop-blur">
        <p className="text-sm font-medium text-text-primary">
          Pause de réflexion ·{" "}
          <span className="text-text-secondary">
            {formatDuration(sessionSeconds)} d&apos;écoute
          </span>
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          As-tu entendu une idée importante ?
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dismissReflection();
              onAddNote();
            }}
          >
            <NotebookPen className="h-4 w-4" />
            Ajouter une note
          </Button>
          <Button size="sm" onClick={resume}>
            <Play className="h-4 w-4" />
            Continuer l&apos;écoute
          </Button>
        </div>
      </div>
    </div>
  );
}
