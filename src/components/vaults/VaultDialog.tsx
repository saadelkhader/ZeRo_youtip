"use client";

import * as React from "react";
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
import { useVaultStore } from "@/lib/stores/vaultStore";
import { useCreateVault, useUpdateVault } from "@/lib/hooks/useVaults";
import {
  VAULT_COLORS,
  VAULT_EMOJIS,
} from "@/components/vaults/vault-constants";
import { cn } from "@/lib/utils/cn";

export function VaultDialog() {
  const { isAddVaultOpen, editingVault, closeAddVault } = useVaultStore();
  const createVault = useCreateVault();
  const updateVault = useUpdateVault();
  const isEditing = Boolean(editingVault);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState<string>(VAULT_EMOJIS[0]);
  const [color, setColor] = React.useState<string>(VAULT_COLORS[0].value);
  const [error, setError] = React.useState<string | null>(null);

  // Seed the form when opening (create → defaults, edit → existing values).
  React.useEffect(() => {
    if (!isAddVaultOpen) return;
    setError(null);
    if (editingVault) {
      setTitle(editingVault.title);
      setDescription(editingVault.description ?? "");
      setIcon(editingVault.icon || VAULT_EMOJIS[0]);
      setColor(editingVault.color || VAULT_COLORS[0].value);
    } else {
      setTitle("");
      setDescription("");
      setIcon(VAULT_EMOJIS[0]);
      setColor(VAULT_COLORS[0].value);
    }
  }, [isAddVaultOpen, editingVault]);

  const pending = createVault.isPending || updateVault.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Donnez un titre à votre vault.");
      return;
    }
    setError(null);
    const input = { title, description, icon, color };
    try {
      if (editingVault) {
        await updateVault.mutateAsync({ id: editingVault.id, input });
      } else {
        await createVault.mutateAsync(input);
      }
      closeAddVault();
    } catch {
      setError("Enregistrement impossible. Réessayez.");
    }
  }

  return (
    <Dialog
      open={isAddVaultOpen}
      onOpenChange={(o) => (o ? null : closeAddVault())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le vault" : "Nouveau vault"}
          </DialogTitle>
          <DialogDescription>
            Regroupez vos vidéos par thème ou objectif d&apos;apprentissage.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto px-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-title">Titre</Label>
            <Input
              id="vault-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Apprentissage machine, Productivité…"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-desc">Description</Label>
            <Textarea
              id="vault-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionnel"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-6 gap-2">
              {VAULT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md border text-lg transition-colors duration-150",
                    icon === e
                      ? "border-accent bg-accent/[0.08]"
                      : "border-border-light hover:bg-surface-secondary",
                  )}
                  aria-pressed={icon === e}
                  aria-label={`Icône ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {VAULT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface-card transition-shadow duration-150",
                    color === c.value
                      ? "ring-2 ring-text-primary"
                      : "ring-0 hover:ring-2 hover:ring-border-strong",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-pressed={color === c.value}
                  aria-label={`Couleur ${c.name}`}
                />
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={closeAddVault} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer"
                : "Créer le Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
