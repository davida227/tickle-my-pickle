'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calculateSinglesElo, calculateDoublesElo } from '@/lib/elo'
import { checkNewAchievements } from '@/lib/achievements'

type SaveGameInput = {
  format: 'singles' | 'doubles'
  team1Score: number
  team2Score: number
  team1Ids: string[]
  team2Ids: string[]
}

export async function saveGame(input: SaveGameInput) {
  // ── Verify authenticated user server-side (never trust client-supplied ID) ──
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }
  const createdBy = user.id

  const { format, team1Score, team2Score, team1Ids, team2Ids } = input
  const admin = createAdminClient()

  // Validate
  if (team1Score === team2Score) return { error: 'Scores cannot be tied.' }
  const requiredPerTeam = format === 'singles' ? 1 : 2
  if (team1Ids.length !== requiredPerTeam || team2Ids.length !== requiredPerTeam)
    return { error: `Need ${requiredPerTeam} player(s) per team.` }

  const allIds = [...team1Ids, ...team2Ids]
  if (new Set(allIds).size !== allIds.length)
    return { error: 'A player cannot appear on both teams.' }

  // Fetch fresh player data (server-side, no stale client cache)
  const { data: players, error: fetchErr } = await admin
    .from('profiles')
    .select('id, username, full_name, elo_rating, wins, losses, current_streak, longest_streak')
    .in('id', allIds)

  if (fetchErr) {
    console.error('Profile fetch error:', fetchErr)
    return { error: `Could not load player profiles: ${fetchErr.message}` }
  }
  if (!players || players.length !== allIds.length) {
    console.error(`Expected ${allIds.length} players, got ${players?.length ?? 0}. IDs:`, allIds)
    return { error: `Could not find all players (found ${players?.length ?? 0} of ${allIds.length}).` }
  }

  const getPlayer = (id: string) => players.find(p => p.id === id)!

  const team1Won = team1Score > team2Score

  // ── Calculate Elo changes ──────────────────────────
  const eloChanges: Record<string, { before: number; change: number; won: boolean }> = {}

  if (format === 'singles') {
    const p1 = getPlayer(team1Ids[0]), p2 = getPlayer(team2Ids[0])
    const result = calculateSinglesElo(p1.elo_rating, p2.elo_rating, team1Won)
    eloChanges[p1.id] = { before: p1.elo_rating, change: result.player1Change, won: team1Won }
    eloChanges[p2.id] = { before: p2.elo_rating, change: result.player2Change, won: !team1Won }
  } else {
    const [p1a, p1b] = [getPlayer(team1Ids[0]), getPlayer(team1Ids[1])]
    const [p2a, p2b] = [getPlayer(team2Ids[0]), getPlayer(team2Ids[1])]
    const result = calculateDoublesElo(
      [p1a.elo_rating, p1b.elo_rating],
      [p2a.elo_rating, p2b.elo_rating],
      team1Won
    )
    eloChanges[p1a.id] = { before: p1a.elo_rating, change: result.team1Change, won: team1Won }
    eloChanges[p1b.id] = { before: p1b.elo_rating, change: result.team1Change, won: team1Won }
    eloChanges[p2a.id] = { before: p2a.elo_rating, change: result.team2Change, won: !team1Won }
    eloChanges[p2b.id] = { before: p2b.elo_rating, change: result.team2Change, won: !team1Won }
  }

  // ── Insert game ────────────────────────────────────
  const { data: game, error: gameError } = await admin
    .from('games')
    .insert({ format, team1_score: team1Score, team2_score: team2Score, created_by: createdBy })
    .select()
    .single()

  if (gameError || !game) return { error: 'Failed to save game.' }

  // ── Insert game_players ────────────────────────────
  const gamePlayers = [
    ...team1Ids.map(id => ({ game_id: game.id, player_id: id, team: 1, elo_before: eloChanges[id].before, elo_change: eloChanges[id].change, won: eloChanges[id].won })),
    ...team2Ids.map(id => ({ game_id: game.id, player_id: id, team: 2, elo_before: eloChanges[id].before, elo_change: eloChanges[id].change, won: eloChanges[id].won })),
  ]

  const { error: gpError } = await admin.from('game_players').insert(gamePlayers)
  if (gpError) return { error: 'Failed to save game players.' }

  // ── Average opponent Elo per team ──────────────────
  const team1AvgElo = team1Ids.reduce((sum, id) => sum + getPlayer(id).elo_rating, 0) / team1Ids.length
  const team2AvgElo = team2Ids.reduce((sum, id) => sum + getPlayer(id).elo_rating, 0) / team2Ids.length

  // ── Fetch existing achievements ────────────────────
  const { data: existingAchievements } = await admin
    .from('achievements')
    .select('player_id, achievement_key')
    .in('player_id', allIds)

  const alreadyEarnedByPlayer: Record<string, string[]> = {}
  allIds.forEach(id => { alreadyEarnedByPlayer[id] = [] })
  existingAchievements?.forEach(ea => {
    alreadyEarnedByPlayer[ea.player_id]?.push(ea.achievement_key)
  })

  // ── Update each player (admin client — bypasses RLS) ──
  for (const [playerId, data] of Object.entries(eloChanges)) {
    const player = getPlayer(playerId)
    const newElo = data.before + data.change

    const prevStreak = player.current_streak ?? 0
    let newStreak: number
    if (data.won) {
      newStreak = prevStreak > 0 ? prevStreak + 1 : 1
    } else {
      newStreak = prevStreak < 0 ? prevStreak - 1 : -1
    }
    const newLongest = Math.max(player.longest_streak ?? 0, newStreak > 0 ? newStreak : 0)
    const totalGames = player.wins + player.losses + 1

    const { error: updateErr } = await admin.from('profiles').update({
      elo_rating: newElo,
      wins: player.wins + (data.won ? 1 : 0),
      losses: player.losses + (data.won ? 0 : 1),
      current_streak: newStreak,
      longest_streak: newLongest,
    }).eq('id', playerId)

    if (updateErr) {
      console.error(`Failed to update profile for ${playerId}:`, updateErr)
      return { error: `Failed to update stats for a player. Please try again.` }
    }

    // Check achievements
    const isTeam1 = team1Ids.includes(playerId)
    const opponentAvgElo = isTeam1 ? team2AvgElo : team1AvgElo

    const newAchievements = checkNewAchievements({
      wonGame: data.won,
      prevWins: player.wins,
      prevStreak,
      newStreak,
      newElo,
      prevElo: data.before,
      totalGames,
      opponentEloAvg: opponentAvgElo,
      alreadyEarned: alreadyEarnedByPlayer[playerId] ?? [],
    })

    if (newAchievements.length > 0) {
      const { error: achError } = await admin.from('achievements').insert(
        newAchievements.map(key => ({ player_id: playerId, achievement_key: key }))
      )
      if (achError) {
        console.error(`Failed to insert achievements for ${playerId}:`, achError)
        // Non-fatal: game was saved successfully; don't block the user
      }
    }
  }

  return { success: true }
}
