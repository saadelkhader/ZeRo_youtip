"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  /** Sober, French, jargon-free error message. Absent on success. */
  error?: string;
}

/** Translate Supabase auth errors into calm French messages. */
function toFrenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre email pour continuer.";
  if (m.includes("user already registered") || m.includes("already exists"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Cette adresse email n'est pas valide.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Réessayez dans un instant.";
  return "Une erreur est survenue. Réessayez.";
}

/** Origin of the current request, for OAuth redirect URLs. */
function getOrigin(): string {
  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!email || !password) {
    return { error: "Renseignez votre email et votre mot de passe." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toFrenchError(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!name.trim()) return { error: "Indiquez votre nom." };
  if (!email || !password) {
    return { error: "Renseignez votre email et votre mot de passe." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name.trim() },
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) return { error: toFrenchError(error.message) };

  // If email confirmation is required, there's no active session yet.
  if (!data.session) {
    redirect("/login?check_email=1");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) return { error: "Connexion avec Google impossible pour l'instant." };

  if (data.url) redirect(data.url);
  return { error: "Connexion avec Google impossible pour l'instant." };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
