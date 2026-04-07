-- ============================================================
-- Tickle my Pickle — Remove Auth Migration
-- Run this in your Supabase SQL Editor BEFORE deploying.
-- ============================================================

-- 1. Decouple profiles from auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Make games.created_by nullable (no logged-in user to attribute to)
ALTER TABLE games ALTER COLUMN created_by DROP NOT NULL;

-- 3. Add soft-delete column to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS games_deleted_at_idx ON games (deleted_at) WHERE deleted_at IS NULL;

-- 4. Drop the auto-create-profile trigger (no more auth signups)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Replace all RLS policies with open access
--    (app is now trust-based, anyone with the URL can use it)

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Open read profiles"  ON profiles FOR SELECT USING (true);
CREATE POLICY "Open insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update profiles" ON profiles FOR UPDATE USING (true) WITH CHECK (true);

-- games
DROP POLICY IF EXISTS "Games are viewable by authenticated users" ON games;
DROP POLICY IF EXISTS "Authenticated users can insert games" ON games;
CREATE POLICY "Open read games"  ON games FOR SELECT USING (true);
CREATE POLICY "Open insert games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update games" ON games FOR UPDATE USING (true) WITH CHECK (true);

-- game_players
DROP POLICY IF EXISTS "Game players are viewable by authenticated users" ON game_players;
DROP POLICY IF EXISTS "Authenticated users can insert game players" ON game_players;
CREATE POLICY "Open read game_players"  ON game_players FOR SELECT USING (true);
CREATE POLICY "Open insert game_players" ON game_players FOR INSERT WITH CHECK (true);

-- achievements
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
DROP POLICY IF EXISTS "Authenticated users can insert achievements" ON achievements;
CREATE POLICY "Open read achievements"  ON achievements FOR SELECT USING (true);
CREATE POLICY "Open insert achievements" ON achievements FOR INSERT WITH CHECK (true);

-- ============================================================
-- Done! Deploy the updated app code after running this.
-- ============================================================
