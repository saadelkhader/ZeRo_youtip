"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MoreHorizontal,
  Play,
  FolderInput,
  ArrowUpDown,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { usePlayerStore } from "@/lib/stores/playerStore";
import {
  useDeleteVideo,
  useMoveVideoToVault,
  useUpdateVideo,
} from "@/lib/hooks/useVideos";
import { formatDuration, progressRatio } from "@/lib/utils/time";
import { buildThumbnailUrl } from "@/lib/utils/youtube";
import { PRIORITY_OPTIONS } from "@/components/vaults/vault-constants";
import type { Vault, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface QueueItemProps {
  video: Video;
  vault?: Vault;
  vaults: Vault[];
  /** Disable drag handle (e.g. in the "now" section). */
  draggable?: boolean;
}

export function QueueItem({
  video,
  vault,
  vaults,
  draggable = true,
}: QueueItemProps) {
  const router = useRouter();
  const loadPlayer = usePlayerStore((s) => s.playVideo);
  const updateVideo = useUpdateVideo();
  const moveVideo = useMoveVideoToVault();
  const deleteVideo = useDeleteVideo();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ratio = video.duration_seconds
    ? progressRatio(video.listened_seconds, video.duration_seconds)
    : 0;

  function play() {
    loadPlayer(video);
    router.push(`/player/${video.youtube_id}`);
  }

  const thumb =
    video.thumbnail_url || buildThumbnailUrl(video.youtube_id, "mqdefault");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border-light bg-surface-card p-3 transition-shadow duration-150",
        isDragging ? "z-10 shadow-elevated" : "shadow-soft",
      )}
    >
      {draggable ? (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-text-tertiary active:cursor-grabbing"
          aria-label="Réorganiser"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}

      {/* Thumbnail */}
      <button
        type="button"
        onClick={play}
        className="relative h-[45px] w-[60px] shrink-0 overflow-hidden rounded-md bg-surface-secondary"
        aria-label="Écouter"
      >
        <Image
          src={thumb}
          alt={`Miniature : ${video.title}`}
          fill
          sizes="60px"
          loading="lazy"
          className="object-cover"
        />
      </button>

      {/* Main */}
      <button
        type="button"
        onClick={play}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
      >
        <p className="line-clamp-2 text-base font-medium text-text-primary">
          {video.title}
        </p>
        <p className="truncate text-sm text-text-secondary">
          {video.channel_name}
          {video.duration_seconds
            ? ` · ${formatDuration(video.duration_seconds)}`
            : ""}
        </p>
        {vault ? (
          <span
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${vault.color}1A`,
              color: vault.color,
            }}
          >
            <span aria-hidden>{vault.icon}</span>
            {vault.title}
          </span>
        ) : null}
        {ratio > 0 ? (
          <Progress
            value={ratio * 100}
            className="mt-1.5 h-[2px] w-full max-w-[200px]"
          />
        ) : null}
      </button>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Options"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={play}>
            <Play />
            Écouter
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            <span className="flex items-center gap-2">
              <FolderInput className="h-3.5 w-3.5" />
              Déplacer vers
            </span>
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() =>
              moveVideo.mutate({ videoId: video.id, vaultId: null })
            }
          >
            📥 Inbox
          </DropdownMenuItem>
          {vaults.map((v) => (
            <DropdownMenuItem
              key={v.id}
              onSelect={() =>
                moveVideo.mutate({ videoId: video.id, vaultId: v.id })
              }
            >
              <span aria-hidden>{v.icon}</span>
              {v.title}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            <span className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Priorité
            </span>
          </DropdownMenuLabel>
          {PRIORITY_OPTIONS.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onSelect={() =>
                updateVideo.mutate({
                  id: video.id,
                  data: { priority: p.value },
                })
              }
            >
              {p.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              updateVideo.mutate({
                id: video.id,
                data: { status: "archived" },
              })
            }
          >
            <Archive />
            Archiver
          </DropdownMenuItem>
          <DropdownMenuItem
            destructive
            onSelect={() => deleteVideo.mutate(video.id)}
          >
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
