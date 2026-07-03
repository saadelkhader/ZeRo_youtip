"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Archive, Trash2, ArchiveRestore } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { useArchiveVault, useDeleteVault } from "@/lib/hooks/useVaults";
import { formatDuration } from "@/lib/utils/time";
import type { Vault } from "@/lib/types";

export interface VaultStats {
  videoCount: number;
  noteCount: number;
  listenedSeconds: number;
}

interface VaultCardProps {
  vault: Vault;
  stats?: VaultStats;
}

export function VaultCard({ vault, stats }: VaultCardProps) {
  const openAddVault = useVaultStore((s) => s.openAddVault);
  const archiveVault = useArchiveVault();
  const deleteVault = useDeleteVault();

  const { videoCount = 0, noteCount = 0, listenedSeconds = 0 } = stats ?? {};

  return (
    <div className="group relative rounded-xl border border-border-light bg-surface-card p-5 shadow-soft transition-[box-shadow,border-color] duration-150 ease-out hover:border-border-strong hover:shadow-card">
      {/* Color dot */}
      <span
        className="absolute right-4 top-4 h-2 w-2 rounded-full"
        style={{ backgroundColor: vault.color }}
        aria-hidden
      />

      <Link
        href={`/vaults/${vault.id}`}
        className="flex flex-col gap-3 outline-none"
      >
        <div className="flex items-center gap-3 pr-6">
          <span className="text-2xl leading-none" aria-hidden>
            {vault.icon}
          </span>
          <h3 className="truncate font-semibold text-text-primary">
            {vault.title}
          </h3>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-text-secondary">
          {vault.description || "Aucune description"}
        </p>

        <p className="text-sm text-text-tertiary">
          <span className="nums-tabular">{videoCount}</span> vidéos ·{" "}
          <span className="nums-tabular">{noteCount}</span> notes ·{" "}
          <span className="nums-tabular">
            {formatDuration(listenedSeconds)}
          </span>{" "}
          d&apos;écoute
        </p>
      </Link>

      {/* Context menu */}
      <div className="absolute bottom-4 right-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Options du vault"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openAddVault(vault)}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                archiveVault.mutate({
                  id: vault.id,
                  archived: !vault.is_archived,
                })
              }
            >
              {vault.is_archived ? <ArchiveRestore /> : <Archive />}
              {vault.is_archived ? "Désarchiver" : "Archiver"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                if (
                  window.confirm(
                    `Supprimer le vault « ${vault.title} » ? Cette action est irréversible.`,
                  )
                ) {
                  deleteVault.mutate(vault.id);
                }
              }}
            >
              <Trash2 />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
