"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/email/send";
import type {
  AccountStatus,
  Invitation,
  UserRole,
} from "@/lib/types";

/** Guard: the caller must be an active admin. Returns the admin user. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Accès refusé");
  if (profile?.account_status === "suspended")
    throw new Error("Compte suspendu");
  return { supabase, user };
}

function inviteUrl(token: string, email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/register?token=${token}&email=${encodeURIComponent(email)}`;
}

// ── Invitations ───────────────────────────────────────────────

export interface SendInvitationResult {
  success: boolean;
  invitation: Invitation;
  /** Shareable link (used when email delivery is disabled). */
  url: string;
  /** Whether an email was actually dispatched. */
  emailSent: boolean;
}

export async function sendInvitation(
  email: string,
): Promise<SendInvitationResult> {
  const { supabase, user } = await requireAdmin();
  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Adresse email invalide.");
  }

  // Already a member?
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);
  void existingProfile; // profiles has no email column; checked via invitations + auth

  // Existing pending invitation?
  const { data: existingInv } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("email", normalized)
    .maybeSingle();

  if (existingInv?.status === "pending") {
    throw new Error("Une invitation est déjà en attente pour cet email.");
  }
  if (existingInv?.status === "accepted") {
    throw new Error("Un compte existe déjà pour cet email.");
  }

  // Re-invite (revoked/expired) → reset; else insert fresh.
  let invitation: Invitation;
  if (existingInv) {
    const { data, error } = await supabase
      .from("invitations")
      .update({
        status: "pending",
        token: undefined, // keep existing token unless regenerated via resend
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        accepted_at: null,
      })
      .eq("id", existingInv.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    invitation = data as Invitation;
  } else {
    const { data, error } = await supabase
      .from("invitations")
      .insert({ email: normalized, invited_by: user.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    invitation = data as Invitation;
  }

  const url = inviteUrl(invitation.token, invitation.email);
  const emailSent = await sendInvitationEmail(invitation.email, url);

  revalidatePath("/admin/invitations");
  return { success: true, invitation, url, emailSent };
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/invitations");
}

export async function resendInvitation(
  invitationId: string,
): Promise<{ url: string; emailSent: boolean }> {
  const { supabase } = await requireAdmin();
  // Regenerate a fresh token + extend expiry.
  const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await supabase
    .from("invitations")
    .update({
      token: newToken,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      accepted_at: null,
    })
    .eq("id", invitationId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const inv = data as Invitation;
  const url = inviteUrl(inv.token, inv.email);
  const emailSent = await sendInvitationEmail(inv.email, url);

  revalidatePath("/admin/invitations");
  return { url, emailSent };
}

export async function getAllInvitations(): Promise<Invitation[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Invitation[];
}

// ── Users ─────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  videoCount: number;
  noteCount: number;
  actionCount: number;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const { supabase } = await requireAdmin();

  const [profiles, videos, notes, actions] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, avatar_url, role, account_status, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("videos").select("user_id"),
    supabase.from("notes").select("user_id"),
    supabase.from("actions").select("user_id"),
  ]);

  const tally = (rows: { user_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
    return m;
  };
  const v = tally(videos.data);
  const n = tally(notes.data);
  const a = tally(actions.data);

  return (profiles.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    avatar_url: p.avatar_url,
    role: p.role as UserRole,
    account_status: p.account_status as AccountStatus,
    created_at: p.created_at,
    videoCount: v.get(p.id) ?? 0,
    noteCount: n.get(p.id) ?? 0,
    actionCount: a.get(p.id) ?? 0,
  }));
}

async function setAccountStatus(userId: string, status: AccountStatus) {
  const { supabase, user } = await requireAdmin();
  if (userId === user.id && status === "suspended") {
    throw new Error("Tu ne peux pas suspendre ton propre compte.");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ account_status: status })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function suspendUser(userId: string) {
  return setAccountStatus(userId, "suspended");
}

export async function activateUser(userId: string) {
  return setAccountStatus(userId, "active");
}

export async function setUserRole(userId: string, role: UserRole) {
  const { supabase, user } = await requireAdmin();
  if (userId === user.id && role !== "admin") {
    throw new Error("Tu ne peux pas retirer ton propre rôle admin.");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

// ── Signup-time validation ────────────────────────────────────

/** Used on the register page to gate the form before signup. */
export async function validateInvitationToken(
  token: string,
  email: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("check_invitation_token", {
    p_token: token,
    p_email: email.trim().toLowerCase(),
  });
  if (error) return false;
  return data === true;
}
