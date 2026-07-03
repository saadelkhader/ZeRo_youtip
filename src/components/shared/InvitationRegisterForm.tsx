"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(3, score) as 0 | 1 | 2 | 3;
  const labels = ["Trop court", "Faible", "Correct", "Solide"];
  return { score: clamped, label: labels[clamped] };
}

export function InvitationRegisterForm({ email }: { email: string }) {
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const strength = passwordStrength(password);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      // The SQL trigger re-checks the invitation server-side at signup.
      const result = await signUp(name, email, password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          autoFocus
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < strength.score
                      ? strength.score >= 3
                        ? "bg-success"
                        : strength.score === 2
                          ? "bg-warning"
                          : "bg-error"
                      : "bg-surface-secondary",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-text-tertiary">{strength.label}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
