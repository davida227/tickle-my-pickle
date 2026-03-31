-- ============================================================
-- Tickle my Pickle — Schema Update v2
-- Adds soft-delete support for games.
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add deleted_at column to games (NULL = active, timestamp = soft-deleted)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Optional but recommended: index to keep "active games" queries fast
CREATE INDEX IF NOT EXISTS games_deleted_at_idx ON games (deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================
-- Done! No server restart needed.
-- ============================================================
