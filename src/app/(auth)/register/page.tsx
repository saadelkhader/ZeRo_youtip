import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvitationRegisterForm } from "@/components/shared/InvitationRegisterForm";
import { validateInvitationToken } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  const token = searchParams.token;
  const email = searchParams.email;

  // CAS B — no token at all: invite-only notice, never show the form.
  if (!token || !email) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <h1 className="mb-1 text-xl font-semibold text-text-primary">
            Sur invitation uniquement
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            ZeRo youtip est sur invitation uniquement. Si tu souhaites un accès,
            contacte un administrateur.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // CAS A (validation) — token present but invalid/expired.
  const valid = await validateInvitationToken(token, email);
  if (!valid) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <h1 className="mb-1 text-xl font-semibold text-text-primary">
            Lien invalide
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Ce lien d&apos;invitation est invalide ou a expiré. Contacte
            l&apos;administrateur pour recevoir un nouveau lien.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // CAS A (valid) — show the invitation-bound signup form.
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h1 className="mb-1 text-xl font-semibold text-text-primary">
          Créer mon compte
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          Tu as été invité(e) à rejoindre ZeRo youtip.
        </p>
        <InvitationRegisterForm email={email} />
      </CardContent>
    </Card>
  );
}
