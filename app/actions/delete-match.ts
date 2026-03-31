'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function deleteRecentMatch() {
  // Verify authenticated user server-side (never trust client-supplied ID)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Step 1: Get all game IDs this user has played in
  const { data: userGamePlayers, error: gpError } = await admin
    .from('game_players')
    .select('game_id')
    .eq('player_id', user.id)

  if (gpError) return { error: 'Failed to fetch game history.' }
  if (!userGamePlayers || userGamePlayers.length === 0) {
    return { error: 'No recent game found.' }
  }

  const gameIds = userGamePlayers.map((gp: any) => gp.game_id)

  // Step 2: Find the most recent non-deleted game the user was in
  const { data: game, error: gameError } = await admin
    .from('games')
    .select(`
      id, created_at,
      game_players(player_id, elo_change, won)
    `)
    .in('id', gameIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (gameError || !game) return { error: 'No recent game found.' }

  // Sanity check: requesting user must be in this game
  const gamePlayers = game.game_players as { player_id: string; elo_change: number; won: boolean }[]
  const userInGame = gamePlayers.some(gp => gp.player_id === user.id)
  if (!userInGame) return { error: 'You were not in this game.' }

  // Step 3: Fetch current profiles for all players in the game
  const playerIds = gamePlayers.map(gp => gp.player_id)
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, elo_rating, wins, losses, current_streak')
    .in('id', playerIds)

  if (profilesError || !profiles) return { error: 'Failed to fetch player profiles.' }

  const getProfile = (id: string) => profiles.find(p => p.id === id)!

  // Step 4: Revert each player's stats
  // Note: we use (current_elo - elo_change) rather than elo_before so that any games
  // a player may have played after this one are preserved correctly.
  for (const gp of gamePlayers) {
    const profile = getProfile(gp.player_id)
    if (!profile) continue

    const revertedElo = profile.elo_rating - gp.elo_change
    const newWins = gp.won ? Math.max(0, profile.wins - 1) : profile.wins
    const newLosses = gp.won ? profile.losses : Math.max(0, profile.losses - 1)

    // Best-effort streak reversal. If this game broke a previous streak (e.g. a win
    // after a losing run set streak to 1) we can't recover the old value — set to 0.
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

  // Step 5: Soft-delete the game (after profiles are updated so a retry is safe)
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
