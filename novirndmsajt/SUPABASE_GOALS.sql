-- Monthly Goals table for Earn Calendar
-- Run this ONCE in Supabase to add the goals feature.
--
-- WHERE TO PASTE:
-- 1. Open https://supabase.com/dashboard and select your project.
-- 2. Click "SQL Editor" in the left sidebar.
-- 3. Click "New query".
-- 4. Paste this entire file.
-- 5. Click "Run" (or press Ctrl+Enter / Cmd+Enter).
--
-- That's it. The goals table will be created and secured with RLS.

-- Table: one goal per user per month (YYYY-MM)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  goal_amount numeric not null default 0,
  unique (user_id, month)
);

-- Index for fast lookups
create index if not exists goals_user_month_idx on public.goals (user_id, month);

-- Row Level Security (same idea as earnings: users only see their own rows)
alter table public.goals enable row level security;

-- Policies
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own"
on public.goals for select to authenticated
using (auth.uid() = user_id);

create policy "goals_insert_own"
on public.goals for insert to authenticated
with check (auth.uid() = user_id);

create policy "goals_update_own"
on public.goals for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own"
on public.goals for delete to authenticated
using (auth.uid() = user_id);
