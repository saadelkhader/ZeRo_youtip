-- ─────────────────────────────────────────────────────────────
-- Crée une invitation pour ton premier compte (futur admin).
-- 1. Remplace l'email ci-dessous par le tien.
-- 2. Exécute (Run).
-- 3. La requête te renvoie le LIEN d'inscription à ouvrir dans le navigateur.
-- ─────────────────────────────────────────────────────────────

insert into invitations (email, status)
values ('saadlkhder3@gmail.com', 'pending')
on conflict (email) do update
  set status = 'pending',
      expires_at = now() + interval '7 days',
      accepted_at = null
returning
  email,
  token,
  'http://localhost:3000/register?token=' || token
    || '&email=' || email as invite_url;
