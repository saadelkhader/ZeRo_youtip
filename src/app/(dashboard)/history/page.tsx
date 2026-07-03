"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  FileText,
  Zap,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHistory } from "@/lib/hooks/useHistory";
import { useVaults } from "@/lib/hooks/useVaults";
import { formatDuration } from "@/lib/utils/time";
import { buildThumbnailUrl } from "@/lib/utils/youtube";
import { INBOX_VALUE } from "@/components/vaults/vault-constants";
import type { HistoryItem } from "@/lib/actions/history";
import { cn } from "@/lib/utils/cn";

const ALL = "__all__";
type Range = "today" | "7d" | "30d" | "all";
type Status = "all" | "completed" | "partial";

function groupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);

  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 14) return "La semaine dernière";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function HistoryPage() {
  const [range, setRange] = React.useState<Range>("7d");
  const [vaultFilter, setVaultFilter] = React.useState(ALL);
  const [status, setStatus] = React.useState<Status>("all");
  const [withNotes, setWithNotes] = React.useState(false);
  const [withActions, setWithActions] = React.useState(false);

  const { data: vaults = [] } = useVaults();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHistory({
    range,
    vaultId: vaultFilter === ALL ? null : vaultFilter,
    status,
    withNotes,
    withActions,
  });

  const items: HistoryItem[] = (data?.pages ?? []).flatMap((p) => p.items);

  // Group consecutive items by their date label.
  const groups: { label: string; items: HistoryItem[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.startedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text-primary">Historique</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd&apos;hui</SelectItem>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="all">Tout</SelectItem>
          </SelectContent>
        </Select>

        <Select value={vaultFilter} onValueChange={setVaultFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
            <SelectValue placeholder="Tous les vaults" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les vaults</SelectItem>
            <SelectItem value={INBOX_VALUE}>📥 Inbox</SelectItem>
            {vaults.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.icon} {v.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
            <SelectItem value="partial">Non terminées</SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setWithNotes((v) => !v)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            withNotes
              ? "border-accent bg-accent/[0.08] text-accent"
              : "border-border-light text-text-secondary hover:bg-surface-secondary",
          )}
        >
          Avec notes
        </button>
        <button
          type="button"
          onClick={() => setWithActions((v) => !v)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            withActions
              ? "border-accent bg-accent/[0.08] text-accent"
              : "border-border-light text-text-secondary hover:bg-surface-secondary",
          )}
        >
          Avec actions
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border-light bg-surface-secondary/40"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Rien dans l'historique"
          description="Ton historique d'écoute s'affichera ici."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-secondary">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-border-light" />
              </div>
              {group.items.map((item) => (
                <HistoryRow key={item.sessionId} item={item} />
              ))}
            </section>
          ))}

          {hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Chargement…" : "Charger plus"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const v = item.video;
  const completed = v?.is_completed;

  const inner = (
    <div className="flex items-center gap-3 rounded-lg border border-border-light bg-surface-card p-3 transition-shadow hover:shadow-soft">
      <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-surface-secondary">
        {v ? (
          <Image
            src={
              v.thumbnail_url || buildThumbnailUrl(v.youtube_id, "mqdefault")
            }
            alt={`Miniature : ${v.title}`}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-text-primary">
          {v?.title ?? "Vidéo supprimée"}
        </p>
        <p className="truncate text-xs text-text-secondary">
          {v?.channel_name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
          {item.vault ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: `${item.vault.color}1A`,
                color: item.vault.color,
              }}
            >
              {item.vault.icon} {item.vault.title}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(item.secondsListened)}
          </span>
          {item.noteCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {item.noteCount}
            </span>
          ) : null}
          {item.hasAction ? (
            <span className="inline-flex items-center gap-1 text-accent">
              <Zap className="h-3 w-3" />
            </span>
          ) : null}
        </div>
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 text-xs",
          completed ? "text-success" : "text-text-tertiary",
        )}
      >
        {completed ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Terminée</span>
          </>
        ) : (
          <>
            <CircleDashed className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Partielle</span>
          </>
        )}
      </span>
    </div>
  );

  return v ? (
    <Link href={`/player/${v.youtube_id}`}>{inner}</Link>
  ) : (
    inner
  );
}
