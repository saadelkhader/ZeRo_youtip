import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/shared/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h1 className="mb-1 text-xl font-semibold text-text-primary">
          Connexion
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          Reprenez là où vous vous êtes arrêté.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
