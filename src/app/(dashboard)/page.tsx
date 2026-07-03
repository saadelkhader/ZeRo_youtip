"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/hooks/useProfile";
import { useTodayStats } from "@/lib/hooks/useStats";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { usePlayerStore } from "@/lib/stores/playerStore";
import {
  formatDuration,
  progressRatio,
  secondsToMinutes,
} from "@/lib/utils/time";
import { buildThumbnailUrl } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils/cn";

function greetingPrefix() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 18) return "Bonjour";
  return "Bonsoir";
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: today } = useTodayStats();
  const { data: dash } = useDashboard();
  const openAddVideo = useVaultStore((s) => s.openAddVideo);
  const playVideo = usePlayerStore((s) => s.playVideo);

  const firstName = (profile?.name ?? "").split(" ")[0] || "👋";
  const limitMinutes = profile?.daily_limit_minutes ?? 60;
  const listenedSeconds = today?.secondsListened ?? 0;
  const limitSeconds = limitMinutes * 60;
  const ratio = progressRatio(listenedSeconds, limitSeconds);
  const overLimit = listenedSeconds >= limitSeconds;

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const resume = dash?.resumeVideo ?? null;
  const nextAction = dash?.nextAction ?? null;
  const queue = dash?.queuePreview ?? [];

  const quickStats = [
    { label: "Vidéos terminées", value: today?.videosCompleted ?? 0 },
    { label: "Notes créées", value: today?.notesCreated ?? 0 },
    { label: "Actions créées", value: today?.actionsCreated ?? 0 },
    { label: "Actions réalisées", value: today?.actionsCompleted ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + daily progress */}
      <div>
        <h1 className="text-2xl font-medium text-text-primary">
          {greetingPrefix()} {firstName}.
        </h1>
        <p className="mt-0.5 text-sm capitalize text-text-secondary">
          {dateLabel}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
            role="progressbar"
            aria-label="Temps d'écoute du jour"
            aria-valuemin={0}
            aria-valuemax={limitMinutes}
            aria-valuenow={secondsToMinutes(listenedSeconds)}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                overLimit ? "bg-error/80" : "bg-accent",
              )}
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary">
            {overLimit ? (
              <span className="text-error/90">Limite atteinte</span>
            ) : (
              <span className="font-mono nums-tabular">
                {secondsToMinutes(listenedSeconds)} min / {limitMinutes} min
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column (60%) */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Next action */}
          {nextAction ? (
            <Card className="border-accent/20 bg-accent/[0.03]">
              <CardContent className="flex flex-col gap-2 p-4">
                <span className="text-xs uppercase tracking-wide text-text-secondary">
                  Prochaine action
                </span>
                <p className="text-base font-medium text-text-primary">
                  {nextAction.title}
                </p>
                <p className="text-xs text-text-secondary">
                  {nextAction.vault
                    ? `${nextAction.vault.icon} ${nextAction.vault.title}`
                    : "Inbox"}
                  {nextAction.estimated_minutes
                    ? ` · ${nextAction.estimated_minutes}min`
                    : ""}
                </p>
                <div>
                  <Button
                    size="sm"
                    className="mt-1 rounded-full"
                    onClick={() => router.push("/actions")}
                  >
                    Commencer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Resume / add */}
          <Card>
            <CardContent className="p-4">
              {resume ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-[60px] w-20 shrink-0 overflow-hidden rounded-md bg-surface-secondary">
                    <Image
                      src={
                        resume.thumbnail_url ||
                        buildThumbnailUrl(resume.youtube_id, "mqdefault")
                      }
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-text-primary">
                      {resume.title}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {resume.channel_name}
                    </p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${
                            progressRatio(
                              resume.listened_seconds,
                              resume.duration_seconds,
                            ) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      playVideo(resume);
                      router.push(`/player/${resume.youtube_id}`);
                    }}
                  >
                    <Play className="h-4 w-4" />
                    Reprendre
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <p className="text-sm text-text-secondary">
                    Rien en cours d&apos;écoute.
                  </p>
                  <Button onClick={openAddVideo}>
                    <Plus className="h-4 w-4" />
                    Ajouter une vidéo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (40%) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Quick stats 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <p className="font-mono text-2xl font-semibold text-text-primary nums-tabular">
                    {s.value}
                  </p>
                  <p className="text-xs text-text-secondary">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Queue preview */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-text-secondary">
                En attente
              </span>
              <Link
                href="/queue"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {queue.length === 0 ? (
              <p className="text-sm text-text-tertiary">
                Aucune vidéo en attente.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {queue.map((v) => (
                  <Link
                    key={v.id}
                    href={`/player/${v.youtube_id}`}
                    className="flex items-center gap-3 rounded-lg border border-border-light bg-surface-card p-2 transition-shadow hover:shadow-soft"
                  >
                    <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-surface-secondary">
                      <Image
                        src={
                          v.thumbnail_url ||
                          buildThumbnailUrl(v.youtube_id, "mqdefault")
                        }
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm text-text-primary">
                        {v.title}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {v.duration_seconds
                          ? formatDuration(v.duration_seconds)
                          : v.channel_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
