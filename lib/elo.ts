const K = 48

/**
 * Calculate expected score for player A against player B
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new Elo rating after a game
 * @param rating - Current rating
 * @param opponent - Opponent's rating
 * @param won - Whether this player/team won
 */
export function newRating(rating: number, opponent: number, won: boolean): number {
  const expected = expectedScore(rating, opponent)
  const actual = won ? 1 : 0
  return Math.round(rating + K * (actual - expected))
}

/**
 * Calculate Elo changes for a singles match
 */
export function calculateSinglesElo(
  player1Rating: number,
  player2Rating: number,
  player1Won: boolean
): { player1New: number; player2New: number; player1Change: number; player2Change: number } {
  const player1New = newRating(player1Rating, player2Rating, player1Won)
  const player2New = newRating(player2Rating, player1Rating, !player1Won)
  return {
    player1New,
    player2New,
    player1Change: player1New - player1Rating,
    player2Change: player2New - player2Rating,
  }
}

/**
 * Calculate Elo changes for a doubles match
 * Uses average team rating; each player gets the same change
 */
export function calculateDoublesElo(
  team1Ratings: [number, number],
  team2Ratings: [number, number],
  team1Won: boolean
): {
  team1New: [number, number]
  team2New: [number, number]
  team1Change: number
  team2Change: number
} {
  const team1Avg = Math.round((team1Ratings[0] + team1Ratings[1]) / 2)
  const team2Avg = Math.round((team2Ratings[0] + team2Ratings[1]) / 2)

  const team1ChangeRaw = newRating(team1Avg, team2Avg, team1Won) - team1Avg
  const team2ChangeRaw = newRating(team2Avg, team1Avg, !team1Won) - team2Avg

  return {
    team1New: [team1Ratings[0] + team1ChangeRaw, team1Ratings[1] + team1ChangeRaw],
    team2New: [team2Ratings[0] + team2ChangeRaw, team2Ratings[1] + team2ChangeRaw],
    team1Change: team1ChangeRaw,
    team2Change: team2ChangeRaw,
  }
}
