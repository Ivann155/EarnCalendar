-- Earn Calendar
-- Supabase SQL schema + RLS policies
-- Paste this into: Supabase Dashboard → SQL Editor → New query → Run

-- Recommended: ensure required extensions exist (usually already enabled on Supabase)
create extension if not exists pgcrypto;

-- Table
create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'USD',
  description text,
  category text,
  created_at timestamp with time zone not null default now()
);

-- Helpful indexes
create index if not exists earnings_user_id_idx on public.earnings (user_id);
create index if not exists earnings_user_created_at_idx on public.earnings (user_id, created_at desc);

-- Row Level Security
alter table public.earnings enable row level security;

-- Policies (drop + recreate for repeatable runs)
drop policy if exists "earnings_select_own" on public.earnings;
drop policy if exists "earnings_insert_own" on public.earnings;
drop policy if exists "earnings_update_own" on public.earnings;
drop policy if exists "earnings_delete_own" on public.earnings;

create policy "earnings_select_own"
on public.earnings
for select
to authenticated
using (auth.uid() = user_id);

create policy "earnings_insert_own"
on public.earnings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "earnings_update_own"
on public.earnings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "earnings_delete_own"
on public.earnings
for delete
to authenticated
using (auth.uid() = user_id);

-- OPTIONAL (recommended) Realtime:
-- If you want Postgres changes to stream to clients via Supabase Realtime, ensure the table is in the publication.
-- This may error if already added; that's fine.
do $$
begin
  alter publication supabase_realtime add table public.earnings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- If you already created the table BEFORE this file had `currency`:
-- run the following migration once in SQL editor:
--   alter table public.earnings
--     add column if not exists currency text not null default 'USD';

