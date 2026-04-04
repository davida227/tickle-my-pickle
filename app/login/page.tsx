'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function PwaInstallTip() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-dark-800 border border-dark-700 text-sm text-dark-300 hover:bg-dark-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📱</span>
          <span>Add to iPhone Home Screen</span>
        </span>
        <span className="text-dark-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 bg-dark-800 border border-dark-700 rounded-2xl p-4 text-sm text-dark-300 space-y-3">
          <p className="text-dark-400 text-xs mb-1">Install like a native app — no App Store needed:</p>
          <ol className="space-y-2.5">
            <li className="flex gap-3">
              <span className="text-brand-600 font-bold shrink-0">1.</span>
              <span>Open this page in <span className="text-dark-100 font-medium">Safari</span> on your iPhone</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-600 font-bold shrink-0">2.</span>
              <span>Tap the <span className="text-dark-100 font-medium">Share button</span> <span className="inline-block bg-dark-700 rounded px-1.5 py-0.5 text-xs">⎋</span> at the bottom of the screen</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-600 font-bold shrink-0">3.</span>
              <span>Scroll down and tap <span className="text-dark-100 font-medium">"Add to Home Screen"</span></span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-600 font-bold shrink-0">4.</span>
              <span>Tap <span className="text-dark-100 font-medium">Add</span> — done! 🥒</span>
            </li>
          </ol>
          <div className="border-t border-dark-700 pt-3">
            <p className="text-dark-500 text-xs">
              <span className="font-medium text-dark-400">Android?</span> Tap the ⋮ menu in Chrome → "Add to Home screen"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Synthetic email — users never see this, Supabase requires an email internally
function toEmail(username: string) {
  return `${username.trim().toLowerCase()}@tmp.pickle`
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const syntheticEmail = toEmail(username)

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: { username, full_name: fullName },
        },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Account created! You can now sign in.')
      setMode('signin')
      setPassword('')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      })
      if (error) {
        setError('Invalid username or password.')
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥒</div>
          <h1 className="text-3xl font-black tracking-tight neon-text">Tickle my Pickle</h1>
          <p className="text-dark-400 mt-1 uppercase tracking-widest text-xs">Dill with it.</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 rounded-2xl shadow-xl p-6 neon-border border-2">
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-dark-700 p-1 mb-6">
            <button
              onClick={() => { setMode('signin'); setError(''); setMessage('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-dark-800 shadow text-dark-100' : 'text-dark-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setMessage('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-dark-800 shadow text-dark-100' : 'text-dark-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="David Alummoottil"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="david"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-brand-500 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-dark-900 py-3 rounded-xl font-black text-sm uppercase tracking-widest neon-btn transition-all active:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

          </form>
        </div>

        {/* PWA install tip */}
        <PwaInstallTip />
      </div>
    </div>
  )
}
