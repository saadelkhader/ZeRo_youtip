"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-xl font-medium text-text-primary">
        Quelque chose s&apos;est mal passé.
      </h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Une erreur inattendue est survenue. Tu peux réessayer ou revenir à
        l&apos;accueil.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="ghost" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
