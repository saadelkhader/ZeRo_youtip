-- ─────────────────────────────────────────────────────────────
-- ZeRo youtip — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Idempotent where practical so it can be re-applied safely.
-- ─────────────────────────────────────────────────────────────

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

-- Users profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  daily_limit_minutes integer default 60,
  default_speed numeric(3,2) default 1.0,
  reflection_pause_minutes integer default 20,
  single_video_mode boolean default false,
  screen_free_mode boolean default false,
  dark_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vaults
create table if not exists vaults (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  icon text default '📁',
  color text default '#3B72E8',
  is_archived boolean default false,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Videos
create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  vault_id uuid references vaults(id) on delete set null,
  youtube_id text not null,
  title text not null,
  channel_name text,
  duration_seconds integer,
  thumbnail_url text,
  youtube_url text not null,
  status text default 'inbox' check (status in ('inbox','queued','playing','completed','archived')),
  priority text default 'this_week' check (priority in ('now','this_week','later','archive')),
  intention text,
  expected_result text,
  max_duration_minutes integer,
  listened_seconds integer default 0,
  position_in_queue integer default 0,
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notes
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete cascade not null,
  vault_id uuid references vaults(id) on delete set null,
  content text not null,
  timestamp_seconds integer,
  tags text[] default '{}',
  importance text default 'medium' check (importance in ('low','medium','high')),
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Actions
create table if not exists actions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete set null,
  vault_id uuid references vaults(id) on delete set null,
  note_id uuid references notes(id) on delete set null,
  title text not null,
  description text,
  estimated_minutes integer,
  due_date timestamptz,
  status text default 'todo' check (status in ('todo','in_progress','done','postponed','abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Listening sessions
create table if not exists listening_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  seconds_listened integer default 0,
  intention_rating text check (intention_rating in ('very_helpful','helpful','not_really','waste')),
  created_at timestamptz default now()
);

-- Favorite channels
create table if not exists favorite_channels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  vault_id uuid references vaults(id) on delete cascade,
  channel_name text not null,
  channel_url text,
  is_avoided boolean default false,
  avoid_reason text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Helpful indexes (frequent foreign-key lookups)
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_vaults_user on vaults(user_id);
create index if not exists idx_videos_user on videos(user_id);
create index if not exists idx_videos_vault on videos(vault_id);
create index if not exists idx_videos_status on videos(user_id, status);
create index if not exists idx_notes_user on notes(user_id);
create index if not exists idx_notes_video on notes(video_id);
create index if not exists idx_actions_user on actions(user_id);
create index if not exists idx_sessions_user on listening_sessions(user_id);
create index if not exists idx_channels_user on favorite_channels(user_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table vaults enable row level security;
alter table videos enable row level security;
alter table notes enable row level security;
alter table actions enable row level security;
alter table listening_sessions enable row level security;
alter table favorite_channels enable row level security;

-- RLS Policies — each user only sees / mutates their own rows.
-- `with check` is required so inserts/updates can't set someone else's id.
drop policy if exists "Users can manage their profile" on profiles;
create policy "Users can manage their profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage their vaults" on vaults;
create policy "Users can manage their vaults" on vaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their videos" on videos;
create policy "Users can manage their videos" on videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their notes" on notes;
create policy "Users can manage their notes" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their actions" on actions;
create policy "Users can manage their actions" on actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their sessions" on listening_sessions;
create policy "Users can manage their sessions" on listening_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their channels" on favorite_channels;
create policy "Users can manage their channels" on favorite_channels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Auto-create a profile row on signup
-- ─────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Keep updated_at fresh on mutation
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','vaults','videos','notes','actions']
  loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format(
      'create trigger set_updated_at before update on %I
         for each row execute procedure set_updated_at()', t
    );
  end loop;
end;
$$;

-- ═════════════════════════════════════════════════════════════
-- Invitation-only access control
-- ═════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- Role + account status on profiles.
alter table profiles add column if not exists
  role text default 'user' check (role in ('admin', 'user'));
alter table profiles add column if not exists
  account_status text default 'active'
  check (account_status in ('active', 'suspended', 'pending'));

-- Invitations.
create table if not exists invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references profiles(id) on delete set null,
  status text default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_invitations_email on invitations(email);
create index if not exists idx_invitations_token on invitations(token);

alter table invitations enable row level security;

-- Admin check via a SECURITY DEFINER function. This is the key to avoiding
-- infinite RLS recursion: the function bypasses RLS when reading profiles,
-- so policies on `profiles` can call it without referencing `profiles` again.
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

-- Only admins can read/write invitations.
drop policy if exists "Admins can manage invitations" on invitations;
create policy "Admins can manage invitations" on invitations
  for all
  using (is_admin())
  with check (is_admin());

-- Admins can read every profile (needed for /admin/users).
drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles" on profiles
  for select
  using (auth.uid() = id or is_admin());

-- Admins can update any profile (suspend / promote / etc.).
drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" on profiles
  for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

-- Validate an invitation token for a given email (used during signup).
create or replace function check_invitation_token(p_token text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from invitations
    where token = p_token
      and email = p_email
      and status = 'pending'
      and expires_at > now()
  );
end;
$$;

-- Expire stale pending invitations (run via Supabase cron if desired).
create or replace function expire_old_invitations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update invitations
  set status = 'expired'
  where status = 'pending' and expires_at < now();
end;
$$;

-- Invitation-aware signup: first user becomes admin; everyone else needs a
-- valid invitation. We RAISE EXCEPTION (which rolls back the auth.users
-- insert) rather than deleting from auth.users inside its own trigger.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  inv record;
begin
  select count(*) into user_count from profiles;

  if user_count = 0 then
    -- First ever user → admin.
    insert into profiles (id, name, avatar_url, role, account_status)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'avatar_url',
      'admin',
      'active'
    );
    return new;
  end if;

  -- Require a valid pending invitation for this email.
  select * into inv from invitations
  where email = new.email
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if inv.id is null then
    raise exception 'No valid invitation for this email';
  end if;

  insert into profiles (id, name, avatar_url, role, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    'user',
    'active'
  );

  update invitations
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
