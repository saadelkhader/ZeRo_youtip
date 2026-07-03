"use client";

import * as React from "react";
import { ListOrdered, Info } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueueItem } from "@/components/queue/QueueItem";
import { useVaults } from "@/lib/hooks/useVaults";
import { useQueue, useReorderQueue } from "@/lib/hooks/useVideos";
import { formatDuration } from "@/lib/utils/time";
import { INBOX_VALUE } from "@/components/vaults/vault-constants";
import type { Video } from "@/lib/types";

const ALL_VAULTS = "__all__";

export default function QueuePage() {
  const { data: vaults = [] } = useVaults();
  const { data: queue = [], isLoading } = useQueue();
  const reorder = useReorderQueue();

  const [vaultFilter, setVaultFilter] = React.useState<string>(ALL_VAULTS);
  const [autoplayDisabled, setAutoplayDisabled] = React.useState(false);
  // Local order overlay so drag feels instant before the server confirms.
  const [order, setOrder] = React.useState<Video[] | null>(null);

  const vaultById = React.useMemo(
    () => new Map(vaults.map((v) => [v.id, v])),
    [vaults],
  );

  // Apply vault filter, then split into "now" vs the rest.
  const filtered = React.useMemo(() => {
    const base = order ?? queue;
    if (vaultFilter === ALL_VAULTS) return base;
    if (vaultFilter === INBOX_VALUE)
      return base.filter((v) => !v.vault_id);
    return base.filter((v) => v.vault_id === vaultFilter);
  }, [order, queue, vaultFilter]);

  const nowVideos = filtered.filter((v) => v.priority === "now").slice(0, 3);
  const restVideos = filtered.filter((v) => v.priority !== "now");

  const totalSeconds = filtered.reduce(
    (sum, v) => sum + (v.duration_seconds ?? 0),
    0,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const base = order ?? queue;
    const oldIndex = base.findIndex((v) => v.id === active.id);
    const newIndex = base.findIndex((v) => v.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(base, oldIndex, newIndex);
    setOrder(next);
    reorder.mutate(next.map((v) => v.id));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[70px] animate-pulse rounded-lg border border-border-light bg-surface-secondary/40"
          />
        ))}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="Ta queue est vide"
        description="Ta queue est vide. Ajoute une vidéo à écouter."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Queue header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          <span className="nums-tabular font-medium text-text-primary">
            {filtered.length}
          </span>{" "}
          vidéos · environ{" "}
          <span className="nums-tabular">{formatDuration(totalSeconds)}</span>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={vaultFilter} onValueChange={setVaultFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[140px] text-sm">
              <SelectValue placeholder="Tous les vaults" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VAULTS}>Tous les vaults</SelectItem>
              <SelectItem value={INBOX_VALUE}>📥 Inbox</SelectItem>
              {vaults.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.icon} {v.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="autoplay"
              checked={autoplayDisabled}
              onCheckedChange={setAutoplayDisabled}
            />
            <Label htmlFor="autoplay" className="cursor-pointer">
              Désactiver l&apos;autoplay
            </Label>
          </div>
        </div>
      </div>

      {/* Soft warning when the queue gets long */}
      {queue.length > 10 ? (
        <div className="flex items-start gap-2 rounded-lg bg-surface-secondary/70 px-4 py-3 text-sm text-text-secondary">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
          <p>
            Tu as <span className="nums-tabular">{queue.length}</span> vidéos en
            attente. Considère d&apos;en archiver certaines.
          </p>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* À écouter maintenant */}
        {nowVideos.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-accent">
              À écouter maintenant
            </h2>
            <SortableContext
              items={nowVideos.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/[0.03] p-2">
                {nowVideos.map((video) => (
                  <QueueItem
                    key={video.id}
                    video={video}
                    vault={
                      video.vault_id
                        ? vaultById.get(video.vault_id)
                        : undefined
                    }
                    vaults={vaults}
                  />
                ))}
              </div>
            </SortableContext>
          </section>
        ) : null}

        {/* Queue */}
        {restVideos.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Queue</h2>
            <SortableContext
              items={restVideos.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {restVideos.map((video) => (
                  <QueueItem
                    key={video.id}
                    video={video}
                    vault={
                      video.vault_id
                        ? vaultById.get(video.vault_id)
                        : undefined
                    }
                    vaults={vaults}
                  />
                ))}
              </div>
            </SortableContext>
          </section>
        ) : null}
      </DndContext>
    </div>
  );
}
