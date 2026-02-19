-- Expenses table for Earn Calendar
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run

-- Table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Indexes (for fast filters by user and date)
create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_user_created_at_idx on public.expenses (user_id, created_at desc);

-- Row Level Security
alter table public.expenses enable row level security;

-- Policies (drop + recreate for repeatable runs)
drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_own"
  on public.expenses
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "expenses_insert_own"
  on public.expenses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "expenses_update_own"
  on public.expenses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_delete_own"
  on public.expenses
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Optional: enable Realtime for expenses (like earnings)
do $$
begin
  alter publication supabase_realtime add table public.expenses;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
