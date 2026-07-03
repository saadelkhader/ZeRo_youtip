"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { NAV_ITEMS, isActiveHref } from "@/components/layout/nav-items";

const DESCRIPTIONS: Record<string, string> = {
  "/": "Votre session d'apprentissage du jour",
  "/vaults": "Vos espaces thématiques",
  "/queue": "Ce que vous allez écouter, dans l'ordre",
  "/notes": "Tout ce que vous avez capturé",
  "/actions": "Les choses à faire après l'écoute",
  "/history": "Ce que vous avez déjà écouté",
  "/stats": "Vos habitudes d'écoute",
  "/settings": "Préférences et limites",
};

/** Derives the page title from the active nav item for the dashboard Header. */
export function HeaderBar() {
  const pathname = usePathname();
  const match =
    [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => isActiveHref(pathname, i.href)) ?? NAV_ITEMS[0];

  // Keep the browser tab title in sync with the active page.
  React.useEffect(() => {
    document.title = `${match.label} · ZeRo youtip`;
  }, [match.label]);

  return <Header title={match.label} description={DESCRIPTIONS[match.href]} />;
}
