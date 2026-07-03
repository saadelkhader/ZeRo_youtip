"use client";

import * as React from "react";
import { FileText, Search, Star, Download } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/notes/NoteCard";
import { useAllNotes } from "@/lib/hooks/useNotes";
import { useVaults } from "@/lib/hooks/useVaults";
import { exportNotes } from "@/lib/actions/notes";
import { INBOX_VALUE } from "@/components/vaults/vault-constants";
import type { NoteImportance } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ALL = "__all__";
type Sort = "recent" | "important" | "video" | "vault";
const IMPORTANCE_FILTERS: NoteImportance[] = ["high", "medium", "low"];
const IMPORTANCE_LABEL: Record<NoteImportance, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Faible",
};
const IMPORTANCE_RANK: Record<NoteImportance, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NotesPage() {
  const { data: notes = [], isLoading } = useAllNotes();
  const { data: vaults = [] } = useVaults();

  const [query, setQuery] = React.useState("");
  const [vaultFilter, setVaultFilter] = React.useState(ALL);
  const [importance, setImportance] = React.useState<NoteImportance | null>(null);
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<Sort>("recent");

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return [...set].slice(0, 12);
  }, [notes]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = notes.filter((n) => {
      if (q && !n.content.toLowerCase().includes(q)) return false;
      if (vaultFilter === INBOX_VALUE && n.vault_id) return false;
      if (vaultFilter !== ALL && vaultFilter !== INBOX_VALUE && n.vault_id !== vaultFilter)
        return false;
      if (importance && n.importance !== importance) return false;
      if (favoritesOnly && !n.is_favorite) return false;
      if (tagFilter.length && !tagFilter.every((t) => n.tags?.includes(t)))
        return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sort === "important")
        return IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
      if (sort === "video")
        return (a.video?.title ?? "").localeCompare(b.video?.title ?? "");
      if (sort === "vault")
        return (a.vault_id ?? "").localeCompare(b.vault_id ?? "");
      return b.created_at.localeCompare(a.created_at);
    });
  }, [notes, query, vaultFilter, importance, favoritesOnly, tagFilter, sort]);

  async function handleExport(format: "md" | "csv") {
    try {
      const content = await exportNotes(format);
      const ext = format === "md" ? "md" : "csv";
      const mime = format === "md" ? "text/markdown" : "text/csv";
      download(`zero-youtip-notes.${ext}`, content, mime);
    } catch {
      // no backend / not authed — ignore
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text-primary">Notes</h1>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Rechercher dans les notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={vaultFilter} onValueChange={setVaultFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
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

        {/* Importance chips */}
        <div className="flex items-center gap-1">
          {IMPORTANCE_FILTERS.map((imp) => (
            <button
              key={imp}
              type="button"
              onClick={() => setImportance((cur) => (cur === imp ? null : imp))}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                importance === imp
                  ? "border-accent bg-accent/[0.08] text-accent"
                  : "border-border-light text-text-secondary hover:bg-surface-secondary",
              )}
            >
              {IMPORTANCE_LABEL[imp]}
            </button>
          ))}
        </div>

        {/* Favorites toggle */}
        <button
          type="button"
          onClick={() => setFavoritesOnly((f) => !f)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
            favoritesOnly
              ? "border-warning/40 bg-warning/10 text-warning"
              : "border-border-light text-text-secondary hover:bg-surface-secondary",
          )}
        >
          <Star
            className="h-3.5 w-3.5"
            fill={favoritesOnly ? "currentColor" : "none"}
          />
          Favoris
        </button>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="ml-auto h-8 w-auto min-w-[150px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récentes</SelectItem>
            <SelectItem value="important">Plus importantes</SelectItem>
            <SelectItem value="video">Par vidéo</SelectItem>
            <SelectItem value="vault">Par Vault</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag multi-select */}
      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => {
            const active = tagFilter.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setTagFilter((cur) =>
                    active ? cur.filter((x) => x !== t) : [...cur, t],
                  )
                }
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-secondary text-text-tertiary hover:text-text-secondary",
                )}
              >
                #{t}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border-light bg-surface-secondary/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? "Aucune note" : "Aucun résultat"}
          description={
            notes.length === 0
              ? "Tes notes apparaîtront ici pendant l'écoute."
              : "Aucune note ne correspond à ces filtres."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Export */}
      {notes.length > 0 ? (
        <div className="flex justify-end pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Exporter mes notes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleExport("md")}>
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("csv")}>
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
