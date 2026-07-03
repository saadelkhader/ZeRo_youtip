import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Logo stacked className="items-center" />
      <h1 className="mt-4 text-xl font-medium text-text-primary">
        Page introuvable
      </h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
