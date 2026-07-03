"use client";

import * as React from "react";
import { Zap } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionRow } from "@/components/actions/ActionRow";
import { useActions } from "@/lib/hooks/useActions";
import { useVaults } from "@/lib/hooks/useVaults";
import { INBOX_VALUE } from "@/components/vaults/vault-constants";
import type { ActionStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ALL = "__all__";

const STATUS_TABS: { value: ActionStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminées" },
  { value: "postponed", label: "Reportées" },
];

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday-first
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default function ActionsPage() {
  const { data: actions = [], isLoading } = useActions();
  const { data: vaults = [] } = useVaults();

  const [statusFilter, setStatusFilter] = React.useState<ActionStatus | "all">(
    "all",
  );
  const [vaultFilter, setVaultFilter] = React.useState(ALL);

  const filtered = React.useMemo(() => {
    return actions.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (vaultFilter === INBOX_VALUE && a.vault_id) return false;
      if (
        vaultFilter !== ALL &&
        vaultFilter !== INBOX_VALUE &&
        a.vault_id !== vaultFilter
      )
        return false;
      return true;
    });
  }, [actions, statusFilter, vaultFilter]);

  const todayActions = filtered.filter((a) => isToday(a.due_date));
  const otherActions = filtered.filter((a) => !isToday(a.due_date));

  // Weekly execution score.
  const weekStart = startOfWeek();
  const weekActions = actions.filter(
    (a) => new Date(a.created_at) >= weekStart,
  );
  const weekDone = weekActions.filter((a) => a.status === "done").length;
  const executionPct =
    weekActions.length > 0
      ? Math.round((weekDone / weekActions.length) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text-primary">Actions</h1>

      {/* Impact score */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-mono text-2xl font-semibold text-text-primary nums-tabular">
              {executionPct}%
            </p>
            <p className="text-sm text-text-secondary">
              d&apos;exécution cette semaine
            </p>
          </div>
          <p className="max-w-[180px] text-right text-xs text-text-tertiary">
            {executionPct >= 60
              ? "Tu transformes ce que tu écoutes en actes."
              : "Chaque action terminée compte."}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                statusFilter === tab.value
                  ? "bg-accent/[0.08] font-medium text-accent"
                  : "text-text-secondary hover:bg-surface-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Select value={vaultFilter} onValueChange={setVaultFilter}>
          <SelectTrigger className="ml-auto h-8 w-auto min-w-[130px] text-sm">
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
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border-light bg-surface-secondary/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={actions.length === 0 ? "Aucune action" : "Aucun résultat"}
          description={
            actions.length === 0
              ? "Aucune action pour l'instant. Écoute une vidéo et crée ta prochaine action."
              : "Aucune action ne correspond à ces filtres."
          }
        />
      ) : (
        <>
          {/* Today */}
          {todayActions.length > 0 ? (
            <section className="flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent/[0.03] p-3">
              <h2 className="text-sm font-medium text-accent">
                Aujourd&apos;hui
              </h2>
              <div className="flex flex-col gap-2">
                {todayActions.map((a) => (
                  <ActionRow key={a.id} action={a} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Everything else */}
          {otherActions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {otherActions.map((a) => (
                <ActionRow key={a.id} action={a} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
