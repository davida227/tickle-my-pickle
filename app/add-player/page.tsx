'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPlayer } from '@/app/actions/add-player'

export default function AddPlayerPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const result = await addPlayer({ username, fullName })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(`${fullName} has been added!`)
    setUsername('')
    setFullName('')
    setLoading(false)

    // Navigate to the new player's profile after a short delay
    setTimeout(() => {
      router.push(`/profile/${result.playerId}`)
      router.refresh()
    }, 1000)
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <h1 className="text-2xl font-black text-dark-100 tracking-tight mb-1">Add Player</h1>
      <p className="text-dark-400 text-xs uppercase tracking-widest mb-6">Add a new player to the rankings</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-600 neon-card space-y-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1.5 font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              maxLength={50}
              className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-1.5 font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required
              maxLength={30}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full border border-dark-600 rounded-xl px-4 py-3 text-sm bg-dark-900 text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-dark-500 mt-1">Lowercase, no spaces</p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success && <p className="text-brand-500 text-sm text-center">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-dark-900 py-4 rounded-2xl font-black uppercase tracking-widest neon-btn active:bg-brand-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Player'}
        </button>
      </form>
    </div>
  )
}
