"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WeeklyChart } from "@/components/stats/WeeklyChart";
import { ImpactCircle } from "@/components/stats/ImpactCircle";
import {
  useWeeklyStats,
  useVaultStats,
  useTopChannels,
  useImpactScore,
} from "@/lib/hooks/useStats";
import { formatDuration, progressRatio } from "@/lib/utils/time";

function impactMessage(score: number): string {
  if (score >= 70) return "Tes écoutes produisent des résultats réels.";
  if (score >= 40) return "Tu commences à transformer l'écoute en actes.";
  if (score > 0) return "Chaque action terminée renforce l'élan.";
  return "Définis une première action pour démarrer.";
}

export default function StatsPage() {
  const { data: weekly } = useWeeklyStats();
  const { data: vaultStats = [] } = useVaultStats();
  const { data: channels = [] } = useTopChannels();
  const { data: impact = 0 } = useImpactScore();

  const [lesson, setLesson] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("zy_weekly_lesson");
      if (v) setLesson(v);
    } catch {
      // ignore
    }
  }, []);

  function saveLesson() {
    try {
      localStorage.setItem("zy_weekly_lesson", lesson);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // ignore
    }
  }

  const maxVaultSeconds = Math.max(
    1,
    ...vaultStats.map((v) => v.secondsListened),
  );

  const metrics = [
    {
      label: "Temps total",
      value: weekly ? formatDuration(weekly.totalSeconds) : "0min",
    },
    { label: "Vidéos terminées", value: weekly?.videosCompleted ?? 0 },
    { label: "Notes créées", value: weekly?.notesCreated ?? 0 },
    { label: "Taux d'exécution", value: `${weekly?.actionExecutionPct ?? 0}%` },
  ];

  const topVault = vaultStats[0];
  const topChannel = channels[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1 — This week */}
      <Card>
        <CardHeader>
          <CardTitle>Cette semaine</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {weekly ? <WeeklyChart days={weekly.days} /> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-0.5">
                <span className="font-mono text-xl font-semibold text-text-primary nums-tabular">
                  {m.value}
                </span>
                <span className="text-xs text-text-secondary">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Impact score */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
          <ImpactCircle score={impact} />
          <p className="max-w-xs text-sm text-text-secondary">
            {impactMessage(impact)}
          </p>
        </CardContent>
      </Card>

      {/* Section 3 — By vault */}
      {vaultStats.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Par Vault</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {vaultStats.map((v) => (
              <div key={v.vaultId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">
                    {v.icon} {v.title}
                  </span>
                  <span className="font-mono text-xs text-text-secondary nums-tabular">
                    {formatDuration(v.secondsListened)} · {v.videoCount} vidéos
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${
                        progressRatio(v.secondsListened, maxVaultSeconds) * 100
                      }%`,
                      backgroundColor: v.color,
                    }}
                  />
                </div>
                <span className="text-xs text-text-tertiary">
                  Taux d&apos;action :{" "}
                  {v.videoCount > 0
                    ? Math.round((v.actionCount / v.videoCount) * 100)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Section 4 — Top channels */}
      {channels.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chaînes les plus utiles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {channels.map((c, i) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="font-mono text-sm text-text-tertiary nums-tabular">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {c.channel}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {c.videoCount} vidéos · {formatDuration(c.secondsListened)} ·{" "}
                    {c.noteCount} notes
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Section 5 — Weekly review */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de cette semaine</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
            <li>
              Tu as le plus écouté :{" "}
              <span className="font-medium text-text-primary">
                {topVault ? `${topVault.icon} ${topVault.title}` : "—"}
              </span>
            </li>
            <li>
              Ta chaîne la plus utile :{" "}
              <span className="font-medium text-text-primary">
                {topChannel ? topChannel.channel : "—"}
              </span>
            </li>
            <li>
              Taux d&apos;exécution :{" "}
              <span className="font-medium text-text-primary">
                {weekly?.actionExecutionPct ?? 0}% de tes actions réalisées
              </span>
            </li>
          </ul>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="lesson"
              className="text-sm font-medium text-text-secondary"
            >
              Leçon principale de la semaine
            </label>
            <Textarea
              id="lesson"
              rows={3}
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              placeholder="Ce que tu retiens, en une phrase…"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={saveLesson}>
              {saved ? "Sauvegardé" : "Sauvegarder la revue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
