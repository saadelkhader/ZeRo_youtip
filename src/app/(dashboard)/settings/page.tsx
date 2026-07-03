"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Download, CalendarDays, Check, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { signOut } from "@/lib/actions/auth";
import { deleteAccount, exportAllData } from "@/lib/actions/profile";
import { exportNotes } from "@/lib/actions/notes";
import { cn } from "@/lib/utils/cn";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-base text-text-primary">{label}</p>
        {description ? (
          <p className="text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
      {children}
    </h2>
  );
}

export default function SettingsPage() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const [limit, setLimit] = React.useState(60);
  const [strictBlock, setStrictBlock] = React.useState(false);
  const [reflection, setReflection] = React.useState("0");
  const [singleVideo, setSingleVideo] = React.useState(false);
  const [speed, setSpeed] = React.useState("1");
  const [name, setName] = React.useState("");

  const [signingOut, startSignOut] = React.useTransition();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, startDelete] = React.useTransition();
  const [savedName, setSavedName] = React.useState(false);

  // Seed from the loaded profile.
  React.useEffect(() => {
    if (!profile) return;
    setLimit(profile.daily_limit_minutes);
    setReflection(String(profile.reflection_pause_minutes));
    setSingleVideo(profile.single_video_mode);
    setSpeed(String(profile.default_speed));
    setName(profile.name ?? "");
  }, [profile]);

  function persist(patch: Parameters<typeof updateProfile.mutate>[0]) {
    updateProfile.mutate(patch);
  }

  async function handleExportNotes() {
    try {
      const md = await exportNotes("md");
      download("zero-youtip-notes.md", md, "text/markdown");
    } catch {
      /* no backend */
    }
  }

  async function handleExportData() {
    try {
      const json = await exportAllData();
      download("zero-youtip-data.json", json, "application/json");
    } catch {
      /* no backend */
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Écoute */}
      <section>
        <SectionTitle>Écoute</SectionTitle>
        <div className="mt-2 divide-y divide-border-light">
          <div className="py-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base text-text-primary">Limite quotidienne</p>
              <span className="font-mono text-sm text-text-secondary nums-tabular">
                {limit} min
              </span>
            </div>
            <Slider
              min={15}
              max={180}
              step={15}
              value={[limit]}
              onValueChange={([v]) => setLimit(v)}
              onValueCommit={([v]) => persist({ daily_limit_minutes: v })}
            />
            <div className="mt-2 flex gap-2">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setLimit(m);
                    persist({ daily_limit_minutes: m });
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    limit === m
                      ? "border-accent bg-accent/[0.08] text-accent"
                      : "border-border-light text-text-secondary hover:bg-surface-secondary",
                  )}
                >
                  {m}min
                </button>
              ))}
            </div>
          </div>

          <Row label="Blocage strict après la limite">
            <Switch checked={strictBlock} onCheckedChange={setStrictBlock} />
          </Row>

          <Row label="Pauses de réflexion">
            <Select
              value={reflection}
              onValueChange={(v) => {
                setReflection(v);
                persist({ reflection_pause_minutes: Number(v) });
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Désactivé</SelectItem>
                <SelectItem value="10">Toutes les 10 min</SelectItem>
                <SelectItem value="20">Toutes les 20 min</SelectItem>
                <SelectItem value="30">Toutes les 30 min</SelectItem>
                <SelectItem value="60">Toutes les heures</SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row label="Mode une seule vidéo par défaut">
            <Switch
              checked={singleVideo}
              onCheckedChange={(v) => {
                setSingleVideo(v);
                persist({ single_video_mode: v });
              }}
            />
          </Row>

          <Row label="Vitesse de lecture par défaut">
            <Select
              value={speed}
              onValueChange={(v) => {
                setSpeed(v);
                persist({ default_speed: Number(v) });
              }}
            >
              <SelectTrigger className="h-8 w-[100px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </div>
      </section>

      <Separator />

      {/* Apparence */}
      <section>
        <SectionTitle>Apparence</SectionTitle>
        <Row label="Thème">
          <div className="flex gap-1.5">
            {[
              { value: "light", label: "Clair" },
              { value: "dark", label: "Sombre" },
              { value: "system", label: "Système" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  theme === t.value
                    ? "border-accent bg-accent/[0.08] text-accent"
                    : "border-border-light text-text-secondary hover:bg-surface-secondary",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Row>
      </section>

      {/* Administration (admins only — surfaced here for mobile access) */}
      {profile?.role === "admin" ? (
        <>
          <Separator />
          <section>
            <SectionTitle>Administration</SectionTitle>
            <Row
              label="Gérer les accès"
              description="Utilisateurs et invitations"
            >
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">
                  <Shield className="h-4 w-4" />
                  Ouvrir
                </Link>
              </Button>
            </Row>
          </section>
        </>
      ) : null}

      <Separator />

      {/* Données */}
      <section>
        <SectionTitle>Données</SectionTitle>
        <div className="mt-2 divide-y divide-border-light">
          <Row label="Exporter toutes mes notes" description="Format Markdown">
            <Button variant="outline" size="sm" onClick={handleExportNotes}>
              <Download className="h-4 w-4" />
              Markdown
            </Button>
          </Row>
          <Row label="Exporter mes données" description="Format JSON complet">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              JSON
            </Button>
          </Row>
          <Row
            label="Google Calendar"
            description="Synchroniser tes actions planifiées"
          >
            <Button variant="outline" size="sm" disabled>
              <CalendarDays className="h-4 w-4" />
              Connecter
            </Button>
          </Row>
        </div>
      </section>

      <Separator />

      {/* Compte */}
      <section>
        <SectionTitle>Compte</SectionTitle>
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm text-text-secondary">
              Nom d&apos;utilisateur
            </label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  persist({ name });
                  setSavedName(true);
                  setTimeout(() => setSavedName(false), 1500);
                }}
              >
                {savedName ? <Check className="h-4 w-4" /> : "Enregistrer"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">Email</label>
            <Input value={profile?.email ?? ""} readOnly disabled />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              disabled={signingOut}
              onClick={() => startSignOut(() => void signOut())}
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Déconnexion…" : "Déconnexion"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(true)}
              className="text-error hover:bg-error/10 hover:text-error"
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </section>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showClose={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ton compte ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Tous tes vaults, vidéos, notes et
              actions seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={() => startDelete(() => void deleteAccount())}
              disabled={deleting}
              className="bg-error text-white hover:bg-error/90"
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
