-- Add currency column to earnings table (if it doesn't exist yet)
-- Run this ONCE in Supabase. Safe to run even if column already exists.
--
-- WHERE TO PASTE:
-- 1. Go to https://supabase.com/dashboard and open your project.
-- 2. In the left sidebar, click "SQL Editor".
-- 3. Click "New query".
-- 4. Paste the SQL below into the editor.
-- 5. Click "Run" (or press Ctrl+Enter / Cmd+Enter).
--
-- Done. The earnings table will have a currency column (default 'USD').

ALTER TABLE public.earnings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
