# Tickle my Pickle — Project Summary
*Use this document to brief Claude chat on the current state of the project.*

---

## What It Is

A mobile web app (PWA) for tracking pickleball games within a small friend group (2–10 people). It handles game logging, Elo ratings, leaderboards, player profiles, streaks, and achievements. Built to feel like a native app on iPhone via "Add to Home Screen."

**App name:** Tickle my Pickle
**Tagline:** Dill with it.
**GitHub repo:** https://github.com/davida227/tickle-my-pickle
**Local path:** ~/Desktop/Claude/pickleball-app
**Status:** Built, not yet deployed to Vercel

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Styling | Tailwind CSS (custom Neon Court theme) |
| Hosting | Vercel (free tier, not yet deployed) |
| Type | PWA / mobile web — no App Store needed |

---

## Supabase Project

- **URL:** https://yyvrysobdidfanblcfjs.supabase.co
- **Anon key:** in `.env.local`
- **Service role key:** in `.env.local` (needed for password reset)

---

## Database Schema

### `profiles` table
```
id UUID (references auth.users)
username TEXT
full_name TEXT
elo_rating INT DEFAULT 1000
wins INT DEFAULT 0
losses INT DEFAULT 0
current_streak INT DEFAULT 0   ← added in schema update
longest_streak INT DEFAULT 0   ← added in schema update
```
*Auto-created via trigger when a user signs up.*

### `games` table
```
id UUID
format TEXT ('singles' | 'doubles')
team1_score INT
team2_score INT
created_by UUID
played_at TIMESTAMPTZ
```

### `game_players` table
```
id UUID
game_id UUID
player_id UUID
team INT (1 or 2)
elo_before INT
elo_change INT
won BOOLEAN
```

### `achievements` table ← new, run schema update SQL
```
id UUID
player_id UUID
achievement_key TEXT
earned_at TIMESTAMPTZ
UNIQUE(player_id, achievement_key)
```

**⚠️ Important:** `supabase-schema-update.sql` in the project root must be run in the Supabase SQL Editor before the app fully works. It adds streak columns and the achievements table.

---

## Authentication

- Email + password (no magic links)
- Email confirmation is **disabled** in Supabase dashboard
- Sign up collects: Full Name, Username, Email, Password
- Password reset: user enters their username or full name → sets new password
  - Uses Supabase admin client (service role key, server-side only)

---

## Elo Rating System

- **Starting rating:** 1000
- **K-factor:** 48 (higher than standard 32, tuned for bursty casual play)
- **Doubles:** team average is used, all team members get same Elo change
- **Tier badges:**
  | Tier | Range |
  |---|---|
  | D | 0 – 750 |
  | C | 751 – 850 |
  | B | 851 – 950 |
  | A | 951 – 1050 |
  | S | 1051+ |

---

## Achievements (8 total)

| Key | Name | Trigger |
|---|---|---|
| `first_win` | First Blood 🎯 | Win your first game |
| `hot_streak_3` | Hot Streak 🔥 | Win 3 in a row |
| `hot_streak_5` | On Fire 🌋 | Win 5 in a row |
| `upset_artist` | Upset Artist 😤 | Beat someone 100+ Elo higher |
| `pickle_master` | Pickle Master 🥒 | Reach S tier (1051+ Elo) |
| `comeback_kid` | Comeback Kid 💪 | Win after a 3+ loss streak |
| `dill_legend` | Dill Legend 👑 | Play 10 games total |
| `iron_pickle` | Iron Pickle 🏅 | Play 25 games total |

Achievements are checked and awarded automatically when a game is logged. Locked ones appear dimmed on the profile page.

---

## App Structure

```
app/
  page.tsx              → Dashboard: Elo, W-L, streak callout, recent games
  login/page.tsx        → Sign in / Sign up + PWA install instructions
  log-game/page.tsx     → Log singles or doubles game (dropdown player select)
  leaderboard/page.tsx  → Rankings sorted by Elo with streak badges
  profile/[id]/page.tsx → Player profile: stats, achievements, H2H, game history
  reset-password/page.tsx → Two-step password reset (username or full name lookup)
  actions/
    reset-password.ts   → Server actions for password reset (uses admin client)

components/
  Navbar.tsx            → Bottom tab bar (Home, Log Game, Rankings, Profile)
  TierBadge.tsx         → D/C/B/A/S tier pill badge
  RatingTooltip.tsx     → ℹ️ tooltip explaining Elo
  AchievementBadge.tsx  → Single badge + AchievementGrid (all 8, locked/unlocked)

lib/
  elo.ts                → Elo calculation logic (K=48, singles + doubles)
  achievements.ts       → Achievement definitions + checkNewAchievements()
  supabase/
    client.ts           → Browser Supabase client
    server.ts           → Server Supabase client
    admin.ts            → Admin client (service role, server-side only)

middleware.ts           → Auth protection (redirects unauthenticated users to /login)
```

---

## UI Theme: Neon Court

Electric lime green (`#39FF14`) on deep black (`#0a0a0a`). High-energy sports aesthetic.

**Key color tokens (tailwind.config.ts):**
| Token | Value | Usage |
|---|---|---|
| `brand-600` | `#39FF14` | Primary neon green |
| `dark-900` | `#0a0a0a` | Page background |
| `dark-800` | `#0f0f1a` | Card background |
| `dark-700` | `#1a1a2e` | Raised/toggle surfaces |
| `dark-600` | `#2a2a3e` | Borders |
| `dark-400` | `#888888` | Secondary text |
| `dark-100` | `#ffffff` | Primary text |

**Custom CSS glow classes (globals.css):**
- `.neon-text` — glowing lime text (used on Elo numbers)
- `.neon-text-sm` — subtler glow
- `.neon-border` — glowing lime border
- `.neon-btn` — button with neon glow shadow
- `.neon-card` — card with subtle neon tint + deep shadow
- `.neon-nav-glow` — upward glow on bottom nav

---

## PWA (iPhone Home Screen)

- `public/manifest.json` configured with name, icons, theme color
- Login page has a collapsible "📱 Add to iPhone Home Screen" tip with step-by-step Safari instructions
- Android instructions included too

---

## Pending Before App Is Live

1. **Run schema update SQL** in Supabase SQL Editor (`supabase-schema-update.sql`)
2. **Deploy to Vercel:**
   - Go to vercel.com → Import `davida227/tickle-my-pickle` from GitHub
   - Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Hit Deploy → get a `*.vercel.app` URL to share
3. **In Supabase dashboard:** Add the Vercel production URL to Auth → URL Configuration → Site URL and Redirect URLs

---

## Feature Ideas (from product backlog)

Already documented in `PRODUCT_IDEAS.md`. Top candidates for next sprint:
- **Rivalry tracking** — head-to-head records (partially in profile already)
- **Season resets** — seasonal leaderboards with soft Elo resets
- **Recent form dots** — colored W/L dots (last 5 games) on leaderboard
- **Rating trend** — ↑↓ arrow on leaderboard showing 30-day movement
- **Glicko-2 migration** — more accurate rating system for small groups with sporadic play
- **Trash talk** — emoji-only comments on profiles/leaderboard
- **Court/location tagging** — tag games with where you played

---

## Other Files

- `ui-concepts.html` — 3 alternative UI mockup concepts (Neon Court, Clean Slate, Dill Pickle Retro) viewable in browser
- `RATING_SYSTEM.md` — product doc explaining Elo, K-factor rationale, tier bands, tooltip copy
- `PRODUCT_IDEAS.md` — full feature ideas and alternative rating systems (Glicko-2, TrueSkill, Bradley-Terry)
- `supabase-schema.sql` — original full schema (run first on a fresh project)
- `supabase-schema-update.sql` — additive migration (streaks + achievements table)
