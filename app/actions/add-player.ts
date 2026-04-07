'use server'

import { createAdminClient } from '@/lib/supabase/admin'

type AddPlayerInput = {
  username: string
  fullName: string
}

export async function addPlayer(input: AddPlayerInput) {
  const username = input.username.trim().toLowerCase().replace(/\s/g, '')
  const fullName = input.fullName.trim()

  if (!username) return { error: 'Username is required.' }
  if (username.length < 2) return { error: 'Username must be at least 2 characters.' }
  if (username.length > 30) return { error: 'Username must be 30 characters or less.' }
  if (!fullName) return { error: 'Full name is required.' }
  if (fullName.length > 50) return { error: 'Full name must be 50 characters or less.' }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .insert({
      username,
      full_name: fullName,
      elo_rating: 1000,
      wins: 0,
      losses: 0,
      current_streak: 0,
      longest_streak: 0,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'That username is already taken.' }
    console.error('Add player error:', error)
    return { error: 'Failed to add player. Please try again.' }
  }

  return { success: true, playerId: data.id }
}
