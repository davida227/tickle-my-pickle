export type AchievementKey =
  | 'first_win'
  | 'hot_streak_3'
  | 'hot_streak_5'
  | 'upset_artist'
  | 'pickle_master'
  | 'comeback_kid'
  | 'dill_legend'
  | 'iron_pickle'

export type Achievement = {
  key: AchievementKey
  name: string
  description: string
  emoji: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'first_win',
    name: 'First Blood',
    description: 'Win your very first game',
    emoji: '🎯',
  },
  {
    key: 'hot_streak_3',
    name: 'Hot Streak',
    description: 'Win 3 games in a row',
    emoji: '🔥',
  },
  {
    key: 'hot_streak_5',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    emoji: '🌋',
  },
  {
    key: 'upset_artist',
    name: 'Upset Artist',
    description: 'Beat someone rated 100+ points higher than you',
    emoji: '😤',
  },
  {
    key: 'pickle_master',
    name: 'Pickle Master',
    description: 'Reach S tier (1051+ rating)',
    emoji: '🥒',
  },
  {
    key: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Win after a 3+ game losing streak',
    emoji: '💪',
  },
  {
    key: 'dill_legend',
    name: 'Dill Legend',
    description: 'Play 10 games total',
    emoji: '👑',
  },
  {
    key: 'iron_pickle',
    name: 'Iron Pickle',
    description: 'Play 25 games total',
    emoji: '🏅',
  },
]

export function getAchievement(key: AchievementKey): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.key === key)
}

/**
 * Given pre-game state and game result, return which new achievements were earned.
 * Checks only unlockable achievements (not already earned ones).
 */
export function checkNewAchievements({
  wonGame,
  prevWins,
  prevStreak,     // positive = win streak, negative = loss streak
  newStreak,
  newElo,
  prevElo,
  totalGames,     // AFTER this game
  opponentEloAvg, // average Elo of opposing team
  alreadyEarned,
}: {
  wonGame: boolean
  prevWins: number
  prevStreak: number
  newStreak: number
  newElo: number
  prevElo: number
  totalGames: number
  opponentEloAvg: number
  alreadyEarned: string[]
}): AchievementKey[] {
  const earned: AchievementKey[] = []
  const has = (k: AchievementKey) => alreadyEarned.includes(k)

  if (!has('first_win') && wonGame && prevWins === 0) {
    earned.push('first_win')
  }
  if (!has('hot_streak_3') && wonGame && newStreak >= 3) {
    earned.push('hot_streak_3')
  }
  if (!has('hot_streak_5') && wonGame && newStreak >= 5) {
    earned.push('hot_streak_5')
  }
  if (!has('upset_artist') && wonGame && opponentEloAvg >= prevElo + 100) {
    earned.push('upset_artist')
  }
  if (!has('pickle_master') && newElo >= 1051 && prevElo < 1051) {
    earned.push('pickle_master')
  }
  if (!has('comeback_kid') && wonGame && prevStreak <= -3) {
    earned.push('comeback_kid')
  }
  if (!has('dill_legend') && totalGames >= 10) {
    earned.push('dill_legend')
  }
  if (!has('iron_pickle') && totalGames >= 25) {
    earned.push('iron_pickle')
  }

  return earned
}
