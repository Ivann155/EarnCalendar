-- Feature first-use tracking for guide popups
-- Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run

create table if not exists public.feature_guide_seen (
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_key text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, feature_key)
);

create index if not exists feature_guide_seen_user_id_idx on public.feature_guide_seen (user_id);

alter table public.feature_guide_seen enable row level security;

drop policy if exists "feature_guide_select_own" on public.feature_guide_seen;
drop policy if exists "feature_guide_insert_own" on public.feature_guide_seen;

create policy "feature_guide_select_own"
  on public.feature_guide_seen for select to authenticated
  using (auth.uid() = user_id);

create policy "feature_guide_insert_own"
  on public.feature_guide_seen for insert to authenticated
  with check (auth.uid() = user_id);
