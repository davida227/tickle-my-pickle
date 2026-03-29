# Tickle my Pickle — Rating System Recommendation

## Context
- Play frequency: 0–2 times per week
- Games per session: ~4 per player
- Typical weekly games: 0–8 (often fewer)
- User base: Small friend group
- Goal: Friendly tracking, not tournament-grade precision

---

## PART 1: System Recommendation

### Recommended System: **Modified Elo with a Friendly Display Layer**

**Why not pure Glicko-2:**
While Glicko-2 is mathematically superior for handling rating uncertainty and rating volatility (both important with infrequent play), it introduces complexity that outweighs the benefit for a casual friend group app. The extra metadata (rating deviation, volatility) would complicate the UI and add little practical value when players are close-knit and play together regularly enough to know the actual skill hierarchy.

**Why modified Elo is better:**
Elo is simpler, more familiar, and works well enough for a friend group. The real problem with standard Elo + K=32 is that:
1. With only 4 games per session, rating swings feel too small and updates feel slow
2. Players won't see meaningful change week-to-week, which feels demotivating
3. The K=32 default was designed for chess where players might play 50+ rated games per year; pickleball here averages 200–400 games per year, but they're concentrated in bouts

### Specific Recommendation:

**Use Elo with K=48** (instead of K=32)
- Increases responsiveness without sacrificing stability
- A win against an equal opponent now swings ±24 instead of ±16 (more visible progress)
- Still conservative enough that a few lucky games don't wildly distort ratings
- Still penalizes losses appropriately

**Add a secondary "Skill Tier" display:**
A friendly 1–5 star or letter grade (S, A, B, C, D) alongside the Elo number. This makes the rating system feel less inscrutable and more game-like. Tier transitions happen every 75–100 Elo points, so players see clear progression milestones.

#### Skill Tier Bands (example):
- **D Tier:** 0–750 Elo
- **C Tier:** 751–850 Elo
- **B Tier:** 851–950 Elo
- **A Tier:** 951–1050 Elo
- **S Tier:** 1051+ Elo

**Why this works for a friend group:**
- K=48 feels more responsive and rewarding without being chaotic
- The tier system gives players a "badge" to chase, which is fun and social
- The Elo number still exists for competitive interest, but the tier is the primary focus
- Easy to explain and easy to celebrate ("You just hit A Tier!")

---

## PART 2: Rating Explanation Verbiage

### Version A — Tooltip (ℹ️ icon next to rating)

**Tooltip Text:**

> Your rating goes up when you win (especially against stronger players) and down when you lose. It's like a skill score that reflects who you've beaten and how often you win.

---

### Version B — Info Section (Collapsible card)

**Section Title:** "How Ratings Work"

**Body Text:**

> Everyone starts at a baseline rating. When you win a match, you gain points; when you lose, you lose some. The bigger the upset (beating someone way better than you, or losing to someone much worse), the bigger the swing. Beating a stronger player earns you more points because it's a tougher win. The more you play, the more your rating settles into your true skill level. In doubles, all four players' ratings adjust equally. Think of your rating as a "trophy number" that bounces around at first but eventually reflects who's actually the best.

---

## Implementation Notes

1. **Starting rating:** 800 Elo (middle of the C Tier band, comfortable midpoint)
2. **K-factor:** 48 for all players (no variance by rating; keeps it simple)
3. **Doubles handling:** All four players' ratings adjust by the same amount (±24 for a K=48 even matchup). This avoids complexity and feels fair for a friend group.
4. **Display priority:**
   - Primary: Tier badge (S/A/B/C/D with emoji or color)
   - Secondary: Elo number (smaller text, available on tap/hover)
5. **Leaderboard sorting:** Sort by Elo number (which determines tier); tier badge is a visual flourish

---

## Why K=48 (not K=32)

| K-factor | Win vs. equal | Loss vs. equal | Responsiveness | Use case |
|----------|---------------|----------------|----------------|----------|
| K=16     | ±8            | ∓8             | Very slow      | High-frequency play |
| K=32     | ±16           | ∓16            | Slow           | Chess (50–100 games/year) |
| **K=48** | **±24**       | **∓24**        | **Good**       | **Casual sports (200+ games/year, bursty)** |
| K=64     | ±32           | ∓32            | Fast / risky   | Rapid/blitz chess |

For pickleball players in a friend group, K=48 hits the sweet spot: enough swing to feel the impact of each win, but not so much that rating becomes noisy.

---

## Migration Note

If you currently have ratings with K=32, you don't need to reset. But starting new players at 800 Elo with K=48 will work smoothly. Existing players' ratings will adjust naturally as they play more games under the new K-factor.
