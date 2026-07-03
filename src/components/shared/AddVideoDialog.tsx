"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Youtube, CheckCircle2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVaultStore } from "@/lib/stores/vaultStore";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useVaults, useCreateVault } from "@/lib/hooks/useVaults";
import { useAddVideo } from "@/lib/hooks/useVideos";
import {
  extractYouTubeMetadata,
  type YoutubeMetadata,
} from "@/lib/utils/youtube";
import {
  INBOX_VALUE,
  PRIORITY_OPTIONS,
} from "@/components/vaults/vault-constants";
import type { VideoPriority } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

// Sentinel select value for the "create a new vault" option.
const NEW_VAULT_VALUE = "__new_vault__";

export function AddVideoDialog() {
  const { isAddVideoOpen, closeAddVideo } = useVaultStore();
  const { data: vaults = [] } = useVaults();
  const addVideo = useAddVideo();
  const createVault = useCreateVault();
  const loadPlayer = usePlayerStore((s) => s.playVideo);
  const router = useRouter();

  const [url, setUrl] = React.useState("");
  const [meta, setMeta] = React.useState<YoutubeMetadata | null>(null);
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Step 2 config
  const [vaultId, setVaultId] = React.useState<string>(INBOX_VALUE);
  const [priority, setPriority] = React.useState<VideoPriority>("this_week");
  const [intention, setIntention] = React.useState("");
  const [newVaultName, setNewVaultName] = React.useState("");

  const lookupSeq = React.useRef(0);
  const creatingVault = vaultId === NEW_VAULT_VALUE;

  const reset = React.useCallback(() => {
    setUrl("");
    setMeta(null);
    setStatus("idle");
    setErrorMsg("");
    setVaultId(INBOX_VALUE);
    setPriority("this_week");
    setIntention("");
    setNewVaultName("");
  }, []);

  function handleClose() {
    reset();
    closeAddVideo();
  }

  // Resolve metadata (debounced) whenever the URL changes.
  const runLookup = React.useCallback(async (value: string) => {
    const seq = ++lookupSeq.current;
    if (!value.trim()) {
      setStatus("idle");
      setMeta(null);
      return;
    }
    setStatus("loading");
    setMeta(null);
    const result = await extractYouTubeMetadata(value);
    if (seq !== lookupSeq.current) return; // a newer lookup superseded this one
    if (result.ok) {
      setMeta(result.data);
      setStatus("idle");
    } else {
      setErrorMsg(result.message);
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    const handle = setTimeout(() => void runLookup(url), 500);
    return () => clearTimeout(handle);
  }, [url, runLookup]);

  async function persist(playNow: boolean) {
    if (!meta) return;
    if (creatingVault && !newVaultName.trim()) {
      setErrorMsg("Donne un nom au nouveau vault.");
      setStatus("error");
      return;
    }
    try {
      // Create the vault first if the user chose "new vault".
      let targetVaultId: string | null;
      if (creatingVault) {
        const vault = await createVault.mutateAsync({
          title: newVaultName.trim(),
        });
        targetVaultId = vault.id;
      } else {
        targetVaultId = vaultId === INBOX_VALUE ? null : vaultId;
      }

      const video = await addVideo.mutateAsync({
        youtube_id: meta.youtube_id,
        title: meta.title,
        channel_name: meta.channel_name,
        thumbnail_url: meta.thumbnail_url,
        youtube_url: meta.youtube_url,
        vault_id: targetVaultId,
        priority,
        intention,
        status: playNow ? "playing" : "queued",
      });
      handleClose();
      if (playNow) {
        loadPlayer(video);
        router.push(`/player/${video.youtube_id}`);
      }
    } catch {
      setErrorMsg("Ajout impossible. Réessayez.");
      setStatus("error");
    }
  }

  const pending = addVideo.isPending || createVault.isPending;

  return (
    <Dialog
      open={isAddVideoOpen}
      onOpenChange={(o) => (o ? null : handleClose())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une vidéo</DialogTitle>
          <DialogDescription>
            Collez un lien YouTube, posez votre intention, puis écoutez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-6">
          {/* Step 1 — URL */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="yt-url">Lien YouTube</Label>
            <div className="relative">
              <Youtube className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-error/80" />
              <Input
                id="yt-url"
                autoFocus
                inputMode="url"
                placeholder="Colle un lien YouTube ici…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
              />
            </div>

            {status === "loading" ? (
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Récupération des infos…
              </p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm text-error">{errorMsg}</p>
            ) : null}
          </div>

          {/* Metadata preview */}
          {meta ? (
            <div className="flex items-center gap-3 rounded-lg border border-border-light bg-surface-secondary/50 p-3">
              <div className="relative h-12 w-[80px] shrink-0 overflow-hidden rounded bg-surface-secondary">
                <Image
                  src={meta.thumbnail_url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-base font-medium text-text-primary">
                  {meta.title}
                </p>
                <p className="truncate text-sm text-text-secondary">
                  {meta.channel_name}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            </div>
          ) : null}

          {/* Step 2 — Config (revealed once metadata resolves) */}
          {meta ? (
            <div className="flex flex-col gap-4 border-t border-border-light pt-4">
              <div className="flex flex-col gap-2">
                <Label>Vault</Label>
                <Select value={vaultId} onValueChange={setVaultId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un vault" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={INBOX_VALUE}>📥 Inbox</SelectItem>
                    {vaults.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.icon} {v.title}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_VAULT_VALUE}>
                      ＋ Nouveau vault
                    </SelectItem>
                  </SelectContent>
                </Select>

                {creatingVault ? (
                  <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/[0.04] p-2">
                    <Plus className="h-4 w-4 shrink-0 text-accent" />
                    <Input
                      autoFocus
                      placeholder="Nom du nouveau vault…"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Priorité</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-sm transition-colors duration-150",
                        priority === p.value
                          ? "border-accent bg-accent/[0.08] font-medium text-accent"
                          : "border-border-light text-text-secondary hover:bg-surface-secondary",
                      )}
                      aria-pressed={priority === p.value}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="yt-intention">Intention</Label>
                <Textarea
                  id="yt-intention"
                  rows={2}
                  placeholder="Pourquoi veux-tu écouter cette vidéo ?"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {meta ? (
            <>
              <Button
                variant="outline"
                onClick={() => void persist(false)}
                disabled={pending}
              >
                Ajouter à la Queue
              </Button>
              <Button onClick={() => void persist(true)} disabled={pending}>
                {pending ? "Ajout…" : "Écouter maintenant"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
