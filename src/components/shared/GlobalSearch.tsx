"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Play,
  FileText,
  Zap,
  Library,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUiStore } from "@/lib/stores/uiStore";
import { useSearch } from "@/lib/hooks/useSearch";
import type { SearchResult, SearchResultType } from "@/lib/actions/search";
import { cn } from "@/lib/utils/cn";

const TYPE_META: Record<
  SearchResultType,
  { icon: typeof Play; label: string }
> = {
  video: { icon: Play, label: "Vidéos" },
  note: { icon: FileText, label: "Notes" },
  action: { icon: Zap, label: "Actions" },
  vault: { icon: Library, label: "Vaults" },
};

/** Global command-palette search. Opened via Ctrl+K or the sidebar button. */
export function GlobalSearch() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUiStore();
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [active, setActive] = React.useState(0);

  const { data, isFetching } = useSearch(debounced);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Flatten grouped results for keyboard navigation.
  const groups = React.useMemo(() => {
    const order: SearchResultType[] = ["video", "note", "action", "vault"];
    const byType: Record<SearchResultType, SearchResult[]> = {
      video: data?.videos ?? [],
      note: data?.notes ?? [],
      action: data?.actions ?? [],
      vault: data?.vaults ?? [],
    };
    return order
      .map((type) => ({ type, items: byType[type] }))
      .filter((g) => g.items.length > 0);
  }, [data]);

  const flat = React.useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  React.useEffect(() => setActive(0), [debounced]);

  // Reset on close.
  React.useEffect(() => {
    if (!isSearchOpen) {
      setQuery("");
      setDebounced("");
      setActive(0);
    }
  }, [isSearchOpen]);

  function go(result: SearchResult) {
    setSearchOpen(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) go(flat[active]);
    }
  }

  let runningIndex = -1;

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        showClose={false}
        className="top-[20%] max-w-xl translate-y-0 p-0"
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border-light px-4">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher vidéos, notes, actions, vaults…"
            className="h-12 w-full bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {isFetching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-tertiary" />
          ) : null}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {debounced.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-text-tertiary">
              Tape au moins 2 caractères pour rechercher.
            </p>
          ) : flat.length === 0 && !isFetching ? (
            <p className="px-2 py-6 text-center text-sm text-text-tertiary">
              Aucun résultat.
            </p>
          ) : (
            groups.map((group) => {
              const Meta = TYPE_META[group.type];
              const Icon = Meta.icon;
              return (
                <div key={group.type} className="mb-2">
                  <p className="px-2 py-1 text-xs font-medium text-text-tertiary">
                    {Meta.label}
                  </p>
                  {group.items.map((item) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                          active === idx
                            ? "bg-surface-secondary"
                            : "hover:bg-surface-secondary/60",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-text-tertiary" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-text-primary">
                            {item.title}
                          </span>
                          {item.subtitle ? (
                            <span className="block truncate text-xs text-text-secondary">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
