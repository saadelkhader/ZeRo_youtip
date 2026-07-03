"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileVideo, Plus, ChevronLeft, Pencil } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/hooks/useVaults";
import { useVaultVideos } from "@/lib/hooks/useVideos";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { formatDuration } from "@/lib/utils/time";
import { buildThumbnailUrl } from "@/lib/utils/youtube";
import type { Video } from "@/lib/types";

export default function VaultDetailPage({
  params,
}: {
  params: { vaultId: string };
}) {
  const { data: vault, isLoading: vaultLoading } = useVault(params.vaultId);
  const { data: videos = [], isLoading } = useVaultVideos(params.vaultId);
  const openAddVideo = useVaultStore((s) => s.openAddVideo);
  const openAddVault = useVaultStore((s) => s.openAddVault);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/vaults"
            className="mb-1 inline-flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
          >
            <ChevronLeft className="h-3 w-3" />
            Vaults
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            {vault ? (
              <>
                <span aria-hidden>{vault.icon}</span>
                {vault.title}
              </>
            ) : vaultLoading ? (
              <span className="h-6 w-40 animate-pulse rounded bg-surface-secondary" />
            ) : (
              "Vault introuvable"
            )}
          </h1>
          {vault?.description ? (
            <p className="mt-0.5 text-sm text-text-secondary">
              {vault.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {vault ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Modifier le vault"
              onClick={() => openAddVault(vault)}
            >
              <Pencil className="h-[18px] w-[18px]" />
            </Button>
          ) : null}
          <Button size="sm" onClick={openAddVideo}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Videos */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[70px] animate-pulse rounded-lg border border-border-light bg-surface-secondary/40"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={FileVideo}
          title="Ce vault est vide"
          description="Ajoutez des vidéos pour les retrouver ici, organisées et prêtes à écouter."
          action={
            <Button onClick={openAddVideo}>
              <Plus className="h-4 w-4" />
              Ajouter une vidéo
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {videos.map((v) => (
            <VaultVideoRow key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VaultVideoRow({ video }: { video: Video }) {
  const router = useRouter();
  const playVideo = usePlayerStore((s) => s.playVideo);
  const thumb =
    video.thumbnail_url || buildThumbnailUrl(video.youtube_id, "mqdefault");

  function play() {
    playVideo(video);
    router.push(`/player/${video.youtube_id}`);
  }

  return (
    <button
      type="button"
      onClick={play}
      className="flex items-center gap-3 rounded-lg border border-border-light bg-surface-card p-3 text-left shadow-soft transition-shadow hover:shadow-card"
    >
      <div className="relative h-[45px] w-[60px] shrink-0 overflow-hidden rounded-md bg-surface-secondary">
        <Image
          src={thumb}
          alt={`Miniature : ${video.title}`}
          fill
          sizes="60px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-medium text-text-primary">
          {video.title}
        </p>
        <p className="truncate text-sm text-text-secondary">
          {video.channel_name}
          {video.duration_seconds
            ? ` · ${formatDuration(video.duration_seconds)}`
            : ""}
        </p>
      </div>
    </button>
  );
}
