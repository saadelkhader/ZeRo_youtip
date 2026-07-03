"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/shared/GoogleButton";
import { signIn } from "@/lib/actions/auth";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const notice =
    params.get("reason") === "suspended"
      ? "Ton compte a été suspendu. Contacte l'administrateur."
      : params.get("check_email") === "1"
        ? "Vérifiez votre boîte mail pour confirmer votre compte."
        : params.get("error") === "oauth"
          ? "La connexion a échoué. Réessayez."
          : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects and never returns.
      const result = await signIn(email, password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {notice ? (
        <p className="rounded-md bg-surface-secondary px-3 py-2 text-sm text-text-secondary">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending ? "Connexion…" : "Continuer"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-text-tertiary">ou</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-text-secondary">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
