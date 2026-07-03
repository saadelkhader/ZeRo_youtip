"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/invitations", label: "Invitations" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent/[0.08] font-medium text-accent"
                : "text-text-secondary hover:bg-surface-secondary",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="ml-2 flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Retour à l&apos;app</span>
      </Link>
    </nav>
  );
}
