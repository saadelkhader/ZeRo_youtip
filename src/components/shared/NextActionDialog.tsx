"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useVaults } from "@/lib/hooks/useVaults";
import { useAddAction } from "@/lib/hooks/useActions";
import { INBOX_VALUE } from "@/components/vaults/vault-constants";
import { cn } from "@/lib/utils/cn";

interface NextActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string | null;
  /** Pre-select this vault (e.g. the current video's vault). */
  defaultVaultId?: string | null;
}

const DURATIONS = [15, 30, 45, 60];

function dateLabel(d: Date | null) {
  if (!d) return "Choisir une date";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function startOfDay(offsetDays: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function NextActionDialog({
  open,
  onOpenChange,
  videoId,
  defaultVaultId,
}: NextActionDialogProps) {
  const { data: vaults = [] } = useVaults();
  const addAction = useAddAction();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vaultId, setVaultId] = React.useState(defaultVaultId ?? INBOX_VALUE);
  const [minutes, setMinutes] = React.useState<number | null>(null);
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [reminder, setReminder] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState("18:00");
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) setVaultId(defaultVaultId ?? INBOX_VALUE);
  }, [open, defaultVaultId]);

  function reset() {
    setTitle("");
    setDescription("");
    setMinutes(null);
    setDueDate(null);
    setReminder(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    let due = dueDate;
    if (due && reminder) {
      const [h, m] = reminderTime.split(":").map(Number);
      due = new Date(due);
      due.setHours(h, m, 0, 0);
    }

    await addAction.mutateAsync({
      title,
      description,
      video_id: videoId ?? null,
      vault_id: vaultId === INBOX_VALUE ? null : vaultId,
      estimated_minutes: minutes,
      due_date: due ? due.toISOString() : null,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quelle est la prochaine action correcte ?</DialogTitle>
          <DialogDescription>
            Transforme ce que tu viens d&apos;apprendre en quelque chose de
            concret.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="flex flex-col gap-4 overflow-y-auto px-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="na-title">Titre de l&apos;action</Label>
            <Input
              id="na-title"
              autoFocus
              placeholder="Ex: Tester un prototype RAG ce soir"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="na-desc">Description</Label>
            <Textarea
              id="na-desc"
              rows={2}
              placeholder="Détails supplémentaires…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vault</Label>
            <Select value={vaultId} onValueChange={setVaultId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INBOX_VALUE}>📥 Inbox</SelectItem>
                {vaults.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.icon} {v.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Durée estimée</Label>
            <div className="flex flex-wrap items-center gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMinutes(d)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    minutes === d
                      ? "border-accent bg-accent/[0.08] font-medium text-accent"
                      : "border-border-light text-text-secondary hover:bg-surface-secondary",
                  )}
                >
                  {d < 60 ? `${d}min` : "1h"}
                </button>
              ))}
              <Input
                type="number"
                min={1}
                placeholder="custom"
                value={minutes != null && !DURATIONS.includes(minutes) ? minutes : ""}
                onChange={(e) =>
                  setMinutes(e.target.value ? Number(e.target.value) : null)
                }
                className="h-8 w-24"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Date prévue</Label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDueDate(startOfDay(0))}
                className="rounded-md border border-border-light px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Aujourd&apos;hui
              </button>
              <button
                type="button"
                onClick={() => setDueDate(startOfDay(1))}
                className="rounded-md border border-border-light px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Demain
              </button>
              <button
                type="button"
                onClick={() => setDueDate(startOfDay(7))}
                className="rounded-md border border-border-light px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Cette semaine
              </button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                      dueDate
                        ? "border-accent text-accent"
                        : "border-border-light text-text-secondary hover:bg-surface-secondary",
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {dateLabel(dueDate)}
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    selected={dueDate}
                    onSelect={(d) => {
                      setDueDate(d);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="na-reminder" className="cursor-pointer">
              Ajouter un rappel
            </Label>
            <div className="flex items-center gap-2">
              {reminder ? (
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-8 w-28"
                />
              ) : null}
              <Switch
                id="na-reminder"
                checked={reminder}
                onCheckedChange={setReminder}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <Button
            onClick={submit}
            disabled={!title.trim() || addAction.isPending}
            className="w-full"
          >
            {addAction.isPending ? "Création…" : "Créer l'action"}
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mx-auto text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Ignorer pour l&apos;instant
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
