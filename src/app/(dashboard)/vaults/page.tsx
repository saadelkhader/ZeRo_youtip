"use client";

import * as React from "react";
import { Library, Plus, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { VaultCard } from "@/components/vaults/VaultCard";
import { FadeIn } from "@/components/shared/motion";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { useVaults } from "@/lib/hooks/useVaults";
import { useVaultStats } from "@/lib/hooks/useStats";
import { cn } from "@/lib/utils/cn";

export default function VaultsPage() {
  const openAddVault = useVaultStore((s) => s.openAddVault);
  const { data: vaults = [], isLoading } = useVaults();
  const { data: vaultStats = [] } = useVaultStats();
  const [showArchived, setShowArchived] = React.useState(false);

  // Map vault id → stats for the cards.
  const statsById = React.useMemo(
    () =>
      new Map(
        vaultStats.map((s) => [
          s.vaultId,
          {
            videoCount: s.videoCount,
            noteCount: 0,
            listenedSeconds: s.secondsListened,
          },
        ]),
      ),
    [vaultStats],
  );

  const active = vaults.filter((v) => !v.is_archived);
  const archived = vaults.filter((v) => v.is_archived);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Mes Vaults</h1>
        <Button size="sm" onClick={() => openAddVault()}>
          <Plus className="h-4 w-4" />
          Nouveau Vault
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border-light bg-surface-secondary/40"
            />
          ))}
        </div>
      ) : active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Aucun vault pour l'instant"
          description="Crée ton premier Vault pour organiser tes écoutes."
          action={
            <Button onClick={() => openAddVault()}>
              <Plus className="h-4 w-4" />
              Créer mon premier Vault
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((v, i) => (
              <FadeIn key={v.id} index={i}>
                <VaultCard vault={v} stats={statsById.get(v.id)} />
              </FadeIn>
            ))}
          </div>

          {/* Archived (collapsible) */}
          {archived.length > 0 ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowArchived((s) => !s)}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    showArchived ? "rotate-0" : "-rotate-90",
                  )}
                />
                Archivés ({archived.length})
              </button>
              {showArchived ? (
                <div className="mt-4 grid grid-cols-1 gap-4 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
                  {archived.map((v) => (
                    <VaultCard key={v.id} vault={v} stats={statsById.get(v.id)} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
