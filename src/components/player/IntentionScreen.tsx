"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatDuration } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

const INTENTION_CHIPS = [
  "Apprendre une compétence",
  "Résoudre un problème",
  "Étudier",
  "Réfléchir",
  "Spiritualité",
  "Se détendre consciemment",
  "Préparer une action",
  "Comprendre un sujet",
];

const DURATION_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "Durée complète", minutes: null },
];

interface IntentionScreenProps {
  video: Video;
}

/** Calm pre-roll: the user sets why they're listening before playback starts. */
export function IntentionScreen({ video }: IntentionScreenProps) {
  const setIntention = usePlayerStore((s) => s.setIntention);
  const skipIntention = usePlayerStore((s) => s.skipIntention);

  const [reason, setReason] = React.useState(video.intention ?? "");
  const [expectedResult, setExpectedResult] = React.useState(
    video.expected_result ?? "",
  );
  const [maxMinutes, setMaxMinutes] = React.useState<number | null>(null);

  function toggleChip(chip: string) {
    setReason((prev) => {
      const has = prev.split(/,\s*/).includes(chip);
      if (has) return prev;
      return prev ? `${prev}, ${chip}` : chip;
    });
  }

  function begin() {
    setIntention({ reason, expectedResult, maxDurationMinutes: maxMinutes });
  }

  return (
    <div className="flex min-h-dvh items-start justify-center bg-surface-secondary px-4 py-10 md:items-center">
      <div className="w-full max-w-lg">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-medium text-text-primary">
            Avant d&apos;écouter
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Définis ton intention pour rester concentré.
          </p>
        </header>

        {/* Compact video card */}
        <div className="mb-6 rounded-lg border border-border-light bg-surface-card p-4 shadow-soft">
          <p className="line-clamp-2 font-medium text-text-primary">
            {video.title}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            {video.channel_name}
            {video.duration_seconds
              ? ` · ${formatDuration(video.duration_seconds)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Pourquoi écoutes-tu ce contenu ?</Label>
            <Textarea
              id="reason"
              rows={2}
              placeholder="Ton intention pour cette écoute…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {INTENTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className="rounded-full border border-border-light px-3 py-1 text-xs text-text-secondary transition-colors duration-150 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-accent"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="result">
              Que veux-tu être capable de faire après ?
            </Label>
            <Textarea
              id="result"
              rows={2}
              placeholder="Le résultat concret que tu vises…"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Durée maximale souhaitée</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMaxMinutes(opt.minutes)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm transition-colors duration-150",
                    maxMinutes === opt.minutes
                      ? "border-accent bg-accent/[0.08] font-medium text-accent"
                      : "border-border-light text-text-secondary hover:bg-surface-card",
                  )}
                  aria-pressed={maxMinutes === opt.minutes}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={begin}
            className="h-12 w-full rounded-xl text-md"
          >
            Commencer l&apos;écoute
          </Button>

          <button
            type="button"
            onClick={skipIntention}
            className="mx-auto text-sm text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Passer cette étape
          </button>
        </div>
      </div>
    </div>
  );
}
