-- ============================================================
-- Tickle my Pickle — Schema Update
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add streak columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0;

-- 2. Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, achievement_key)
);

-- 3. Enable Row Level Security on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for achievements
--    Anyone logged in can read all achievements (for profile display)
CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  USING (auth.role() = 'authenticated');

--    Any authenticated user can insert achievements
--    (The log-game page awards them on behalf of all participants)
CREATE POLICY "Authenticated users can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Done! After running this, restart your dev server:
--   npm run dev
-- ============================================================
