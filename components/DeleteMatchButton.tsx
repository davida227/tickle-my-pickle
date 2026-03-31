'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRecentMatch } from '@/app/actions/delete-match'

export default function DeleteMatchButton() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    setError(null)
    const result = await deleteRecentMatch()
    setIsDeleting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setShowModal(false)
    setSuccess(true)
    router.refresh()

    // Clear success banner after 3 s
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="mb-3 rounded-xl px-4 py-3 bg-brand-600/10 border border-brand-600/30 text-sm text-brand-500 font-medium">
          Match deleted. Elo ratings reversed.
        </div>
      )}

      <button
        onClick={() => { setError(null); setShowModal(true) }}
        className="text-xs text-dark-500 hover:text-red-400 transition-colors flex items-center gap-1 mt-2"
        aria-label="Delete most recent match"
      >
        🗑 Delete most recent match
      </button>

      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => !isDeleting && setShowModal(false)}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 px-6">
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-white font-bold text-lg mb-2">Delete Match?</h2>
              <p className="text-dark-400 text-sm mb-5 leading-relaxed">
                This will reverse Elo ratings for all players and remove the game from
                history. Achievements earned in this match will <span className="text-dark-200 font-semibold">not</span> be revoked.
              </p>

              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {isDeleting ? 'Deleting…' : 'Delete Match'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
