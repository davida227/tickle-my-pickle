'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteRecentMatch() {
  const admin = createAdminClient()

  // Step 1: Find the most recent non-deleted game
  const { data: game, error: gameError } = await admin
    .from('games')
    .select(`
      id, created_at,
      game_players(player_id, elo_change, won)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (gameError || !game) return { error: 'No recent game found.' }

  const gamePlayers = game.game_players as { player_id: string; elo_change: number; won: boolean }[]

  // Step 2: Fetch current profiles for all players in the game
  const playerIds = gamePlayers.map(gp => gp.player_id)
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, elo_rating, wins, losses, current_streak')
    .in('id', playerIds)

  if (profilesError || !profiles) return { error: 'Failed to fetch player profiles.' }

  const getProfile = (id: string) => profiles.find(p => p.id === id)

  // Step 3: Revert each player's stats
  for (const gp of gamePlayers) {
    const profile = getProfile(gp.player_id)
    if (!profile) continue

    const revertedElo = profile.elo_rating - gp.elo_change
    const newWins = gp.won ? Math.max(0, profile.wins - 1) : profile.wins
    const newLosses = gp.won ? profile.losses : Math.max(0, profile.losses - 1)

    // Best-effort streak reversal
    const s = profile.current_streak
    let newStreak: number
    if (gp.won) {
      newStreak = s > 1 ? s - 1 : 0
    } else {
      newStreak = s < -1 ? s + 1 : 0
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ elo_rating: revertedElo, wins: newWins, losses: newLosses, current_streak: newStreak })
      .eq('id', gp.player_id)

    if (updateErr) {
      console.error(`Failed to revert profile for ${gp.player_id}:`, updateErr)
      return { error: 'Failed to revert player stats. Please try again.' }
    }
  }

  // Step 4: Soft-delete the game (after profiles are updated so a retry is safe)
  const { error: deleteErr } = await admin
    .from('games')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', game.id)

  if (deleteErr) {
    console.error('Failed to soft-delete game:', deleteErr)
    return { error: 'Failed to delete game record. Please try again.' }
  }

  return { success: true }
}
