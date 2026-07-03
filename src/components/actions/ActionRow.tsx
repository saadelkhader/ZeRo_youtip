"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Clock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useUpdateActionStatus,
  useDeleteAction,
} from "@/lib/hooks/useActions";
import { BounceOnActive } from "@/components/shared/motion";
import type { ActionStatus } from "@/lib/types";
import type { ActionWithContext } from "@/lib/actions/userActions";
import { cn } from "@/lib/utils/cn";

const STATUS_META: Record<
  ActionStatus,
  { label: string; variant: "default" | "accent" | "success" | "warning" }
> = {
  todo: { label: "À faire", variant: "default" },
  in_progress: { label: "En cours", variant: "accent" },
  done: { label: "Terminée", variant: "success" },
  postponed: { label: "Reportée", variant: "warning" },
  abandoned: { label: "Abandonnée", variant: "default" },
};

const STATUS_OPTIONS: ActionStatus[] = [
  "todo",
  "in_progress",
  "done",
  "postponed",
  "abandoned",
];

interface ActionRowProps {
  action: ActionWithContext;
}

export function ActionRow({ action }: ActionRowProps) {
  const updateStatus = useUpdateActionStatus();
  const deleteAction = useDeleteAction();
  const [justChecked, setJustChecked] = React.useState(false);

  const isDone = action.status === "done";
  const meta = STATUS_META[action.status];

  function toggleDone(checked: boolean) {
    if (checked) setJustChecked(true);
    updateStatus.mutate({
      id: action.id,
      status: checked ? "done" : "todo",
    });
  }

  const dueLabel = action.due_date
    ? new Date(action.due_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border-light bg-surface-card p-3 shadow-soft transition-all duration-200",
        isDone && "opacity-60",
        justChecked && "translate-y-1",
      )}
    >
      <BounceOnActive active={isDone} className="mt-0.5 inline-flex">
        <Checkbox
          checked={isDone}
          onCheckedChange={(v) => toggleDone(v === true)}
          aria-label="Marquer comme terminée"
        />
      </BounceOnActive>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-text-primary transition-all duration-200",
            isDone && "text-text-tertiary line-through",
          )}
        >
          {action.title}
        </p>
        {action.description ? (
          <p className="truncate text-xs text-text-secondary">
            {action.description}
          </p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {action.vault ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${action.vault.color}1A`,
                color: action.vault.color,
              }}
            >
              <span aria-hidden>{action.vault.icon}</span>
              {action.vault.title}
            </span>
          ) : null}
          {action.video ? (
            <Badge variant="outline">
              <Play className="h-3 w-3" />
              {action.video.title.slice(0, 24)}
            </Badge>
          ) : null}
          {action.estimated_minutes ? (
            <Badge variant="outline">
              <Clock className="h-3 w-3" />
              {action.estimated_minutes}min
            </Badge>
          ) : null}
          {dueLabel ? (
            <span className="text-xs text-text-tertiary">· {dueLabel}</span>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Options de l'action"
          className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => updateStatus.mutate({ id: action.id, status: s })}
            >
              {STATUS_META[s].label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Pencil />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            destructive
            onSelect={() => deleteAction.mutate(action.id)}
          >
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
