'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface FindUserResult {
  found: boolean
  userId?: string
  displayName?: string
}

interface UpdatePasswordResult {
  success: boolean
  error?: string
}

/**
 * Find a user by username (exact, case-insensitive) or full name (case-insensitive)
 */
export async function findUserByIdentifier(
  identifier: string
): Promise<FindUserResult> {
  try {
    // Use admin client — user is not authenticated yet during password reset
    const admin = createAdminClient()

    // Query for username (exact match, case-insensitive)
    const { data: userByUsername } = await admin
      .from('profiles')
      .select('id, full_name, username')
      .ilike('username', identifier)
      .single()

    if (userByUsername) {
      return {
        found: true,
        userId: userByUsername.id,
        displayName: userByUsername.full_name || userByUsername.username,
      }
    }

    // Query for full_name (case-insensitive)
    const { data: userByFullName } = await admin
      .from('profiles')
      .select('id, full_name, username')
      .ilike('full_name', `%${identifier}%`)
      .limit(1)
      .single()

    if (userByFullName) {
      return {
        found: true,
        userId: userByFullName.id,
        displayName: userByFullName.full_name || userByFullName.username,
      }
    }

    return { found: false }
  } catch (error) {
    console.error('Error finding user:', error)
    return { found: false }
  }
}

/**
 * Update a user's password using the admin client
 * Password must be at least 6 characters
 */
export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<UpdatePasswordResult> {
  try {
    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long',
      }
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update password',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating password:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating the password',
    }
  }
}
