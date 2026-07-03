-- ─────────────────────────────────────────────────────────────
-- HOTFIX : corrige "infinite recursion detected in policy for
-- relation profiles" (code 42P17).
-- Colle CE fichier entier dans le SQL Editor de Supabase et exécute.
-- Sûr à ré-exécuter (idempotent).
-- ─────────────────────────────────────────────────────────────

-- Fonction SECURITY DEFINER : contourne la RLS pour lire le rôle,
-- ce qui casse la boucle de récursion sur profiles.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Réécrit les 3 policies fautives pour utiliser is_admin().
drop policy if exists "Admins can manage invitations" on invitations;
create policy "Admins can manage invitations" on invitations
  for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles" on profiles
  for select
  using (auth.uid() = id or is_admin());

drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" on profiles
  for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());
