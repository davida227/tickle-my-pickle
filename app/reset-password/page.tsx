'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { findUserByIdentifier, updatePassword } from '@/app/actions/reset-password'

type Step = 'identify' | 'reset'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('identify')
  const [identifier, setIdentifier] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFindAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    if (!identifier.trim()) {
      setError('Please enter a username or name')
      setLoading(false)
      return
    }

    const result = await findUserByIdentifier(identifier)

    if (result.found && result.userId && result.displayName) {
      setUserId(result.userId)
      setDisplayName(result.displayName)
      setStep('reset')
      setIdentifier('')
    } else {
      setError('No account found with that username or name')
    }

    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await updatePassword(userId, newPassword)

    if (result.success) {
      setSuccessMessage('Password updated successfully! Redirecting to sign in...')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      setError(result.error || 'Failed to update password')
    }

    setLoading(false)
  }

  function handleBackToIdentify() {
    setStep('identify')
    setUserId('')
    setDisplayName('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back to sign in link */}
        <div className="mb-8">
          <Link
            href="/login"
            className="text-xs text-dark-400 underline hover:text-dark-300 transition-colors flex items-center gap-1"
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥒</div>
          <h1 className="text-3xl font-black tracking-tight neon-text">Tickle my Pickle</h1>
          <p className="text-dark-400 mt-1 uppercase tracking-widest text-xs">Reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 rounded-2xl shadow-xl p-6 neon-border border-2">
          {/* Step indicator */}
          <p className="text-xs text-dark-400 text-center mb-6">
            {step === 'identify' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </p>

          {step === 'identify' ? (
            /* Step 1: Identify yourself */
            <form onSubmit={handleFindAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">
                  Enter your username or full name
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g., david or David Alummoottil"
                  className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={loading}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-dark-900 py-3 rounded-xl font-black text-sm uppercase tracking-widest neon-btn transition-all active:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Find My Account'}
              </button>
            </form>
          ) : (
            /* Step 2: Set new password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-dark-300 mb-4">
                Setting password for <span className="font-semibold text-dark-100">{displayName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={loading}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {successMessage && <p className="text-brand-500 text-sm">{successMessage}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-dark-900 py-3 rounded-xl font-black text-sm uppercase tracking-widest neon-btn transition-all active:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={handleBackToIdentify}
                disabled={loading}
                className="w-full text-xs text-dark-400 underline hover:text-dark-300 transition-colors py-2"
              >
                ← Back to find account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
