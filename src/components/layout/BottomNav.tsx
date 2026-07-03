"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  NAV_ITEMS,
  PRIMARY_MOBILE_HREFS,
  isActiveHref,
} from "@/components/layout/nav-items";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";

const PRIMARY = NAV_ITEMS.filter((i) => PRIMARY_MOBILE_HREFS.includes(i.href));
const OVERFLOW = NAV_ITEMS.filter((i) => !PRIMARY_MOBILE_HREFS.includes(i.href));

/**
 * Mobile bottom navigation: 4 primary tabs + a "More" button that opens a
 * bottom drawer with the remaining destinations. Fixed, frosted, 60px tall.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { isMoreDrawerOpen, openMoreDrawer, closeMoreDrawer } = useUiStore();

  const moreActive = OVERFLOW.some((i) => isActiveHref(pathname, i.href));

  return (
    <>
      <nav
        className="surface-blur fixed inset-x-0 bottom-0 z-30 flex h-[60px] items-stretch border-t border-border-light md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY.map((item) => {
          const active = isActiveHref(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1"
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors duration-150",
                  active ? "text-accent" : "text-text-tertiary",
                )}
              />
              <span
                className={cn(
                  "text-[11px] leading-none transition-colors duration-150",
                  active ? "font-medium text-accent" : "text-text-tertiary",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openMoreDrawer}
          className="flex flex-1 flex-col items-center justify-center gap-1"
          aria-label="Plus d'options"
        >
          <MoreHorizontal
            className={cn(
              "h-[22px] w-[22px] transition-colors duration-150",
              moreActive ? "text-accent" : "text-text-tertiary",
            )}
          />
          <span
            className={cn(
              "text-[11px] leading-none transition-colors duration-150",
              moreActive ? "font-medium text-accent" : "text-text-tertiary",
            )}
          >
            More
          </span>
        </button>
      </nav>

      <Sheet
        open={isMoreDrawerOpen}
        onOpenChange={(o) => (o ? openMoreDrawer() : closeMoreDrawer())}
      >
        <SheetContent side="bottom" className="pb-8">
          <div className="mb-4 flex items-center justify-between">
            <SheetTitle>Plus</SheetTitle>
            <ThemeToggle />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OVERFLOW.map((item) => {
              const active = isActiveHref(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMoreDrawer}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors duration-150",
                    active
                      ? "bg-accent/[0.08] font-medium text-accent"
                      : "text-text-secondary hover:bg-surface-secondary",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
