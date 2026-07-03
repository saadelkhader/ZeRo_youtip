"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DailyQuota } from "@/components/layout/DailyQuota";
import { Search, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, isActiveHref } from "@/components/layout/nav-items";
import { useUiStore } from "@/lib/stores/uiStore";
import { useProfile } from "@/lib/hooks/useProfile";
import { useTodayStats } from "@/lib/hooks/useStats";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  user?: {
    name: string;
    avatar_url: string | null;
  };
  listenedSeconds?: number;
  limitMinutes?: number;
}

/**
 * Fixed 240px sidebar (desktop only). Logo at top, nav in the middle,
 * a compact user + daily-quota block pinned to the bottom.
 */
export function Sidebar({ user, listenedSeconds, limitMinutes }: SidebarProps) {
  const pathname = usePathname();
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const { data: profile } = useProfile();
  const { data: today } = useTodayStats();

  // Prefer live data, then explicit props, then sensible defaults.
  const displayUser = user ?? {
    name: profile?.name || "Vous",
    avatar_url: profile?.avatar_url ?? null,
  };
  const listened = listenedSeconds ?? today?.secondsListened ?? 0;
  const limit = limitMinutes ?? profile?.daily_limit_minutes ?? 60;

  const initials = displayUser.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border-light bg-surface-card md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="ZeRo youtip — accueil">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>

      {/* Search */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-border-light px-3 py-2 text-sm text-text-tertiary transition-colors duration-150 hover:bg-surface-secondary hover:text-text-secondary"
        >
          <Search className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 text-left">Rechercher</span>
          <kbd className="rounded border border-border-light px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActiveHref(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors duration-150 ease-out",
                    active
                      ? "bg-accent/[0.08] font-medium text-accent"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: admin (if admin) + user + daily quota */}
      <div className="px-3 pb-4">
        {profile?.role === "admin" ? (
          <>
            <Separator className="mb-2" />
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <Shield className="h-4 w-4 text-text-tertiary" />
              Administration
            </Link>
          </>
        ) : null}
        <Separator className="mb-3" />
        <div className="rounded-lg bg-surface-secondary/60 p-3">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {displayUser.avatar_url ? (
                <AvatarImage
                  src={displayUser.avatar_url}
                  alt={displayUser.name}
                />
              ) : null}
              <AvatarFallback>{initials || "ZY"}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-text-primary">
              {displayUser.name}
            </span>
          </div>
          <DailyQuota listenedSeconds={listened} limitMinutes={limit} />
        </div>
      </div>
    </aside>
  );
}
