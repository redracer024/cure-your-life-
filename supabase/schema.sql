-- Cure Your Life+ Supabase starter schema
-- Run this in Supabase SQL Editor.
-- Do not paste service-role keys into source code. The database has enough problems without public secrets.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'inactive',
  source text not null default 'manual',
  stripe_customer_id text,
  stripe_subscription_id text,
  google_play_purchase_token text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decoder_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptom text not null,
  habits text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists decoder_reports_user_id_created_at_idx on public.decoder_reports(user_id, created_at desc);
create index if not exists journal_entries_user_id_created_at_idx on public.journal_entries(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.decoder_reports enable row level security;
alter table public.journal_entries enable row level security;

-- Profiles: users can read and update themselves.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Subscriptions: users can read their own status, but writes should happen from backend/service role only.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Decoder reports: users can manage their own saved reports.
drop policy if exists "decoder_reports_select_own" on public.decoder_reports;
create policy "decoder_reports_select_own"
  on public.decoder_reports
  for select
  using (auth.uid() = user_id);

drop policy if exists "decoder_reports_insert_own" on public.decoder_reports;
create policy "decoder_reports_insert_own"
  on public.decoder_reports
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "decoder_reports_delete_own" on public.decoder_reports;
create policy "decoder_reports_delete_own"
  on public.decoder_reports
  for delete
  using (auth.uid() = user_id);

-- Journal entries: users can manage their own rows.
drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own"
  on public.journal_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own"
  on public.journal_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own"
  on public.journal_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own"
  on public.journal_entries
  for delete
  using (auth.uid() = user_id);

-- Auto-create a profile row when a Supabase auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
