# Tickle my Pickle: Product Strategy & Feature Ideas

**Product:** Pickleball game tracking and rating system for small friend groups (2-10 people)
**Current Tech Stack:** Next.js + Supabase + Vercel
**Date:** March 2026

---

## Table of Contents

1. [How Elo Works](#how-elo-works)
2. [Alternative Rating Systems](#alternative-rating-systems)
3. [New Feature Ideas](#new-feature-ideas)
4. [Leaderboard Improvements](#leaderboard-improvements)

---

## How Elo Works

### What is an Elo Rating?

An **Elo rating** is a numerical measure of player skill based on competitive game results. The system was invented in 1960 by Arpad Elo, a Hungarian-American chess master, to rank chess players objectively. Today, it's used in chess, many esports titles, and competitive games worldwide.

**The core idea:** Your rating should reflect your true skill level. Every time you play someone, the rating system updates based on:
- How much better or worse you are than your opponent
- Whether you won or lost
- How much your result was "expected" vs. "surprising"

### How Elo Goes Up and Down

After each game, one of four things happens:

1. **You beat someone worse than you** → Small rating gain
2. **You beat someone better than you** → Large rating gain (upset!)
3. **You lose to someone worse than you** → Large rating loss (upset!)
4. **You lose to someone better than you** → Small rating loss

**Why?** The system rewards beating better players and penalizes losses to worse players, because these results are surprising and informative about true skill.

### What Affects How Many Points You Gain/Lose?

The primary factors are:

1. **The K-factor (32 in our app):** How volatile the system is. Higher K = bigger rating swings. K=32 is standard for most games.

2. **Rating difference:** A bigger gap between opponents = bigger swings if the underdog wins, smaller swings if the favorite wins.

3. **Probability of expected outcome:** This is calculated from the rating difference. The system compares:
   - **Expected result:** "Based on ratings, Player A should win 75% of the time"
   - **Actual result:** "Player A won" or "Player A lost"
   - **Surprise factor:** How much the result deviated from expectation

### Concrete Example

**Setup:**
- Player A: 1050 Elo
- Player B: 980 Elo
- Difference: 70 points
- K-factor: 32

**Expected Win Probability (simplified formula):**
- Player A is expected to win about 60% of matches (they're rated higher)
- Player B is expected to win about 40% of matches

**Scenario 1: Player A wins (the favorite wins)**
- Player A gains: ~5 points → New rating: 1055
- Player B loses: ~5 points → New rating: 975
- Explanation: This was expected, so minimal movement.

**Scenario 2: Player B wins (the underdog wins!)**
- Player A loses: ~24 points → New rating: 1026
- Player B gains: ~24 points → New rating: 1004
- Explanation: This was surprising! Player B proved they're better than their rating suggested.

**The formula (simplified):**
```
New Elo = Old Elo + K × (Result - Expected Probability)
```

Where:
- `Result` = 1 if you won, 0 if you lost
- `Expected Probability` = chance you should have won (based on rating difference)
- `K` = 32 in our system

### Doubles Elo System

In doubles play, the current system averages team ratings:

**How it works:**
- Players are paired (Team A vs Team B)
- Each team's rating = (Player 1 Elo + Player 2 Elo) / 2
- Elo is calculated as if two single players competed
- Each individual player gains/loses the same amount

**Example:**
- Team A: Player 1 (1100) + Player 2 (950) = avg 1025
- Team B: Player 3 (1000) + Player 4 (1050) = avg 1025
- If Team A wins, both Player 1 and Player 2 gain points; both lose if Team A loses

### Limitations of Elo for a Small Group

For a 2-10 person friend group, Elo has some real challenges:

1. **Sample size:** With only a few dozen games, ratings are volatile and less meaningful. In chess, strong players might play 100+ games/season. A small group might play 20.

2. **Unequal match frequency:** Some players might play 10 games, others 3. The system trusts frequent players more, but they might just be lucky.

3. **Partnership variance in doubles:** If your doubles partner changes often, their rating affects your expected outcome, not your actual skill with different partners.

4. **Smurf/new player problem:** A new player starts at 1000 and might go on a winning streak, but the system updates slowly.

5. **Cannot account for improving players:** Elo assumes ratings converge to true skill, but doesn't accelerate for obvious improvement curves.

6. **No uncertainty bounds:** The system doesn't distinguish between "Player X is definitely 1050" vs. "Player X could be 950-1150, we're not sure."

**Bottom line:** Elo is great for ranking, but a small group might benefit from a system that acknowledges uncertainty in skill estimates.

---

## Alternative Rating Systems

### 1. TrueSkill (Microsoft)

**How it works:**
- Each player is represented by a bell curve (normal distribution) with a mean rating and uncertainty bound.
- Instead of a single number (e.g., 1050), you have a range: "1050 ± 100" (meaning 68% confidence the true skill is 950-1150).
- When you play a game, the system updates both your mean AND your uncertainty.
- Winning when uncertain moves your rating more than winning when you're already well-known.

**Pros:**
- Excellent for small sample sizes; handles uncertainty explicitly
- New players' ratings stabilize faster with large initial uncertainty bands
- Partners in doubles are handled naturally (system can optimize for different pairings)
- More mathematically sophisticated; used by Halo, major esports

**Cons:**
- Complex to explain to non-technical users ("What does ±100 mean?")
- Harder to implement; requires Bayesian probability libraries
- More computation per update
- Overkill for a casual friend group?

**For a 2-10 person friend group?**
- **Moderate fit.** Handles the small sample size problem beautifully, but you'd need a good UI to explain uncertainty. Would work well if you want players to feel like their rating is still "settling" early on.

---

### 2. Glicko-2 (Mark Glickman)

**How it works:**
- An improvement on Elo designed specifically for games with infrequent play.
- Each player has: a rating, a confidence interval (RD = "rating deviation"), and a volatility estimate.
- If you haven't played in a month, your RD increases (your rating becomes less certain).
- After wins/losses, RD decreases (your rating becomes more certain).
- The K-factor adapts based on your RD and recent volatility.

**Pros:**
- Handles rating decay for inactive players (perfect for seasonal play)
- Balances between Elo simplicity and TrueSkill sophistication
- Used by chess.com and many competitive games
- Clear rules for player inactivity

**Cons:**
- Still requires explaining RD to users
- More complex than Elo but less powerful than TrueSkill
- Volatility calculation can be unpredictable at first

**For a 2-10 person friend group?**
- **Excellent fit.** If your friend group has sporadic play (play 5 games in January, 0 in February, 8 in March), Glicko-2 naturally handles the ups and downs. Ratings won't inflate artificially during inactive periods.

---

### 3. Bradley-Terry Model (My choice)

**How it works:**
- A probabilistic model used in sports ranking and chess (alternative to Elo).
- Each player has a "strength" parameter (like Elo rating).
- The probability that Player A beats Player B is modeled as: P(A beats B) = strength_A / (strength_A + strength_B)
- The system fits strength values to match observed game results using statistical optimization.

**Pros:**
- Mathematically elegant and well-studied in academia
- Easy to explain: "Player A is 1.5x as strong as Player B" (ratio interpretation)
- Can naturally incorporate draws and margin of victory
- Less volatile than Elo for small samples; more stable

**Cons:**
- Requires iterative optimization to compute (slower than Elo's closed form)
- Harder to explain to casual users than Elo
- Less culturally familiar (Elo is the gold standard)
- Requires offline processing if you update all ratings at once

**For a 2-10 person friend group?**
- **Good fit.** More stable than Elo, ratio interpretation is intuitive, but requires more computation. Could be combined with a simple UI like Elo.

---

### Recommendation

**For Tickle my Pickle, I recommend: Glicko-2**

**Reasoning:**
1. **Friend group seasonality:** Pickleball is seasonal. Groups play heavily in summer, drop off in winter. Glicko-2 naturally accounts for this without artificial rating inflation.
2. **Sweet spot complexity:** More sophisticated than Elo (handles the small-sample problem), but not as intimidating as TrueSkill for your target audience.
3. **Active player incentive:** The RD (rating deviation) concept creates a subtle incentive: "Play more to lock in your rating" or "Don't play for a month = your rating becomes fuzzy."
4. **Implementation:** Reasonably approachable in code; Glicko-2 formulas are well-documented.
5. **User communication:** You can hide RD from casual users and just show the rating, or explain it as "confidence in your rating."

**Optional enhancement:** Use Glicko-2 on the backend, but consider showing a simplified UI layer:
- Display: "Your rating: 1050" (clean)
- Hover tooltip: "Based on 12 games over 3 months" (builds trust in the number)

---

## New Feature Ideas

### 1. **Streaks & Achievements**

**What it is:**
- Track consecutive wins and losses for each player.
- Award badges for milestones: "5-game win streak," "Unbeaten in doubles," "Biggest upset," etc.

**Why valuable:**
- Gamification keeps players engaged between seasons.
- Celebrates individual moments, not just season ranking.
- Friendly competition driver ("Beat your personal best streak").

**Implementation complexity:** Easy
- Database: Add `current_streak`, `longest_streak`, `badges` columns to players table.
- Logic: Update streak counters after each game.
- UI: Display badge carousel on profile, leaderboard badge indicators.

---

### 2. **Rivalry Tracking**

**What it is:**
- Show head-to-head records between specific player pairs (e.g., "Player A vs Player B: 5-3 all-time").
- Display on player profiles and as a "Rivalry card" when two players play.

**Why valuable:**
- Creates narrative engagement ("You're 0-2 against this person, time to turn it around!").
- Highlights interesting dynamics in the group.
- Fun stat to brag about.

**Implementation complexity:** Easy
- Database: Add `head_to_head` table with (player1_id, player2_id, wins1, wins2, draws).
- Logic: Update after each singles game.
- UI: Display on profiles, pre-game card shows "Rivalry: 3-3 tied!"

---

### 3. **Season Resets & Progression**

**What it is:**
- Divide the year into seasons (e.g., Spring, Summer, Fall).
- At season start, reset ratings to a baseline (or carry forward with decay).
- Track season-specific leaderboards and awards.
- Annual "Pickleball Champion" trophy.

**Why valuable:**
- Gives inactive players a fair restart point.
- Celebrates multiple winners throughout the year.
- Encourages seasonal play patterns (natural for pickleball).
- Archival: "Who dominated summer 2026?"

**Implementation complexity:** Medium
- Database: Add `season_id` foreign key to games, track `season_start_rating` per player.
- Logic: Automated season transitions (monthly cron job).
- UI: Season selector dropdown, historical season archive.

---

### 4. **Court/Location Tracking**

**What it is:**
- Tag games with location (e.g., "Central Park Courts," "Home driveway").
- Filter stats by location (e.g., "My win rate at Central Park vs. Home").
- Show location heat map or frequency chart.

**Why valuable:**
- Reveals if you're stronger at certain locations.
- Helps schedule games ("We won 80% at the park last season, let's go back!").
- Location-specific bragging rights.
- Data for trip planning.

**Implementation complexity:** Easy
- Database: Add `location_id` foreign key to games; locations table.
- Logic: Filter stats queries by location.
- UI: Location selector in game log, location stats dashboard card.

---

### 5. **Match Challenges / Friendly Wagers**

**What it is:**
- Players can challenge each other to rematches or specific pairings.
- Optional: Add a "wager" system (points, bragging rights, emoji stakes).
- Post-game: "Rematch accepted!" notifications.

**Why valuable:**
- Turns passive ratings into active competitive narratives.
- Encourages specific matchups ("I want to play her 1v1").
- Fun social mechanism to drive game scheduling.

**Implementation complexity:** Medium
- Database: Add `challenges` table (challenger_id, opponent_id, status, wager, expiry).
- Logic: Notify opposing player, mark rematch when fulfilled.
- UI: "Challenge this player" button on profiles, challenges inbox.

---

### 6. **Fun Advanced Stats**

**What it is:**
- Calculate and display:
  - **Biggest upset:** Game where lower-rated player beat higher-rated player with largest Elo swing.
  - **Longest rally streak:** Cumulative performance across multiple games (e.g., "Won last 4 games in a row").
  - **Most improved:** Player with biggest rating gain in last 30 days.
  - **Clutch player:** Win rate in tight games (within 2 points).
  - **Consistency:** Standard deviation of rating (low = consistent, high = streaky).

**Why valuable:**
- Celebrates different types of excellence.
- Gives story angles ("That's the biggest upset ever!").
- Keeps stats fresh and fun; people love being in lists.

**Implementation complexity:** Easy
- Database: Precompute stats weekly (or on-demand).
- Logic: SQL queries with date filters and calculations.
- UI: "This week's stats" dashboard, leaderboard alternative views.

---

### 7. **Mobile-Optimized Quick Logging**

**What it is:**
- Fast-path game entry: 2 taps to log a game for a regular group composition.
- One-click shortcuts for common setups (e.g., "5-player rotation, 2 teams").
- Voice-to-text for score entry.

**Why valuable:**
- Frictionless logging means more games actually recorded.
- Reduces data lag (log *during* games, not after).
- Mobile-first approach for casual group use.

**Implementation complexity:** Easy
- UI: Redesign game log form with larger buttons, swipe shortcuts.
- Logic: Store common game templates per group.
- (Stretch) Voice API integration for score transcription.

---

### 8. **Trash Talk / Leaderboard Comments**

**What it is:**
- Allow players to leave comments on their own profile or leaderboard position.
- Moderated or emoji-only to keep it fun.
- Example: "Reigning champion 👑" or "Coming back next season 💪"

**Why valuable:**
- Light social interaction without leaving the app.
- Humanizes the leaderboard.
- Trash talk is part of game culture (harmless fun).

**Implementation complexity:** Easy
- Database: Add `comments` table (player_id, text, created_at).
- Logic: Simple CRUD, optional moderation queue.
- UI: Comment section on profile, pins to leaderboard card.

---

### 9. **Game Notifications & Social Feed** (Bonus idea)

**What it is:**
- Real-time notifications when someone logs a win/loss involving you.
- In-app feed showing recent games: "Player A just beat Player B 21-15!"

**Why valuable:**
- Keeps the group engaged even when not playing.
- FOMO-lite ("You weren't there for that game?!").
- Natural social glue for distributed groups.

**Implementation complexity:** Medium
- Database: Add `activity_feed` table, `notifications` table.
- Logic: Emit events on game creation, subscribe users to relevant events.
- UI: Bell icon with unread count, feed swipeable card view.

---

### 10. **Prediction / Betting Integration** (Optional: For fun)

**What it is:**
- Before a game, players predict outcomes and earn "bragging points" for correct predictions.
- Optional: Emoji-based betting (no real money): "I bet 5 🍌 on Player A."

**Why valuable:**
- Adds meta-game layer.
- Engages spectators (people watching can bet too).
- Prediction accuracy becomes a new leaderboard.

**Implementation complexity:** Hard
- Database: Predictions table, leaderboard aggregation.
- Logic: Score predictions on game completion.
- UI: Prediction modal pre-game, accuracy stats on profile.
- (Avoid real money; keep it fun points only)

---

## Leaderboard Improvements

### Additional Columns/Stats to Display

**Current state:** Likely just rating and rank.

**Recommended additions:**

1. **Games Played (W-L record)**
   - Example: "1050 Elo | 23-17 record | 57% win rate"
   - Adds credibility: "Is this person really 1050, or lucky?"

2. **Rating Trend (Last 30 days)**
   - Visual: Small sparkline or ↑↓ arrow with color
   - Example: "1050 Elo ↑ (was 1020)" or "1050 Elo ↓ (was 1080)"
   - Tells story: "Are they improving or declining?"

3. **Recent Form (Last 5 games)**
   - Visual: Colored dots (green = win, red = loss)
   - Example: "● ● ● ○ ●" (won 3 of last 5)
   - Shows momentum: "Hot player right now?"

4. **Win Rate (optional secondary sort)**
   - Example: "1050 Elo | 57% win rate (20 games)"
   - Helps compare players at similar ratings

5. **Streak Status (Live)**
   - Example: "1050 Elo | 🔥 3-game streak" or "1050 Elo | 😅 2-loss streak"
   - Quick emotional read on current status

6. **Last Played**
   - Example: "1050 Elo | Last played 3 days ago"
   - Shows active vs. inactive players
   - Relevant if using Glicko-2 (rating uncertainty grows with inactivity)

### Showing Rating Trends Over Time

**Option A: Sparkline Chart (Recommended)**
- Small inline chart showing rating over last 30/60/90 days
- Hover to see exact values
- Implementation: Use a lightweight charting library (Recharts, Chart.js)
- Example: See a visual slope of rating changes at a glance

**Option B: Rating History Graph (Full page)**
- Dedicated "Player Stats" page with detailed rating history chart
- Toggle between different time ranges
- Overlay multiple players for comparison
- Implementation: More complex, but very powerful

**Option C: Trend Badge**
- Simple color-coded indicator: 🟢 (up), 🔴 (down), 🟡 (stable)
- Show arrow + points gained/lost: "↑ +45 pts this month"

### Divisions/Tiers System

**The concept:**
- Instead of a flat leaderboard, group players into tiers (Bronze, Silver, Gold, Platinum, Diamond).
- Based on rating ranges or percentile ranking.

**Pros:**
- Celebrates achievement in smaller steps ("You made Gold!")
- Reduces leaderboard dominance of top 1-2 players
- Friendly tier names are relatable
- Natural "ladder climbing" narrative

**Cons:**
- More complexity to explain
- With 10 players, you might have only 1-2 per tier (feels arbitrary)
- Players naturally compare across tiers anyway

**Recommendation for a 2-10 person group:**
- **Optional/soft feature.** Implement as visual flourish (badge on profile), not hard gates
- Example tiers:
  - 🥉 **Bronze:** 0-900 Elo
  - 🥈 **Silver:** 900-1000 Elo
  - 🥇 **Gold:** 1000-1100 Elo
  - 💎 **Platinum:** 1100+ Elo
- Show tier name and progress bar to next tier, but don't gate features by tier

**Alternative (better for small groups):**
- Skip hard tiers, use **soft "hype levels"** based on trend
- Example: "Lava (hot streak) | Steady | Cooling off" based on recent form
- Fun, non-competitive vibe

---

## Suggested Implementation Roadmap

**Phase 1 (Core - Weeks 1-2):**
- Migrate to Glicko-2 rating system (backend update)
- Add Elo explanation to help/settings
- Add Games Played (W-L) + Win Rate to leaderboard
- Add 30-day trend indicator to leaderboard

**Phase 2 (Engagement - Weeks 3-4):**
- Streaks & Achievements
- Rivalry tracking
- Enhanced player profile with head-to-head stats
- Fun stats dashboard (Biggest Upset, etc.)

**Phase 3 (Social - Weeks 5-6):**
- Season system (infrastructure)
- Match challenges
- Comments/profiles

**Phase 4 (Polish - Weeks 7+):**
- Court/location tracking
- Game prediction layer
- Mobile-optimized quick logging
- Social feed

---

## Notes for Product Discussions

1. **Rating system migration:** Glicko-2 is an upgrade but not a breaking change. You can migrate existing players by using current Elo as initial rating and setting RD to 100 (medium uncertainty).

2. **Small group dynamics:** These features should emphasize fun and narrative over pure ranking. Streaks, rivalries, and achievements make it feel like a story unfolding, not just a leaderboard.

3. **Telemetry:** Before building, consider tracking: which stats players look at most, which features they use, which players are inactive. Use this to prioritize.

4. **Community over competition:** Position the app as "capturing our group's pickleball journey" rather than "proving who's best." This unlocks more feature ideas (location history, season archives, group milestones).

---

**Document prepared for product roadmap planning and stakeholder alignment.**
