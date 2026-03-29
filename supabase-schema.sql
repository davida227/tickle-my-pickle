-- ============================================================
-- Pickleball App — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Authentication: standard Supabase email/password auth. Email confirmation is disabled in the Supabase dashboard.

-- PROFILES (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  elo_rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now()
);

-- GAMES
create table public.games (
  id uuid primary key default gen_random_uuid(),
  format text not null check (format in ('singles', 'doubles')),
  team1_score integer not null,
  team2_score integer not null,
  created_by uuid references public.profiles(id),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- GAME PLAYERS (who played in each game, and their Elo movement)
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  team integer not null check (team in (1, 2)),
  elo_before integer not null,
  elo_change integer not null,
  won boolean not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;

-- Profiles: anyone can read, users can only update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Games: anyone logged in can read and insert
create policy "Games are viewable by authenticated users"
  on public.games for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert games"
  on public.games for insert with check (auth.role() = 'authenticated');

-- Game players: anyone logged in can read and insert
create policy "Game players are viewable by authenticated users"
  on public.game_players for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert game players"
  on public.game_players for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
