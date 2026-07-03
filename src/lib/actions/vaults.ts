"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Vault } from "@/lib/types";

export interface VaultInput {
  title: string;
  description?: string | null;
  icon?: string;
  color?: string;
}

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return { supabase, userId: user.id };
}

export async function getVaults(): Promise<Vault[]> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("vaults")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Vault[];
}

export async function getVault(id: string): Promise<Vault | null> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("vaults")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Vault) ?? null;
}

export async function createVault(input: VaultInput): Promise<Vault> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("vaults")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      icon: input.icon ?? "📁",
      color: input.color ?? "#3B72E8",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/vaults");
  return data as Vault;
}

export async function updateVault(
  id: string,
  input: Partial<VaultInput> & { is_archived?: boolean },
): Promise<Vault> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("vaults")
    .update({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.is_archived !== undefined
        ? { is_archived: input.is_archived }
        : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/vaults");
  return data as Vault;
}

export async function archiveVault(id: string, archived = true) {
  return updateVault(id, { is_archived: archived });
}

export async function deleteVault(id: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("vaults").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vaults");
}
