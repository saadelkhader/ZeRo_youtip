"use client";

import { Plus } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "@/lib/stores/vaultStore";

interface HeaderProps {
  title?: string;
  description?: string;
}

/**
 * Sticky top header for dashboard pages. On mobile it also surfaces the
 * wordmark (the sidebar is hidden there). Hosts the global "add video" CTA.
 */
export function Header({ title, description }: HeaderProps) {
  const openAddVideo = useVaultStore((s) => s.openAddVideo);

  return (
    <header className="surface-blur sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-light px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span className="md:hidden">
          <Logo />
        </span>
        {title ? (
          <div className="hidden min-w-0 flex-col md:flex">
            <h1 className="truncate text-xl font-semibold text-text-primary">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-sm text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button size="sm" onClick={openAddVideo} className="shrink-0">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Ajouter</span>
      </Button>
    </header>
  );
}
