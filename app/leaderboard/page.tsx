import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, full_name, elo_rating, wins, losses, current_streak, longest_streak')
    .order('elo_rating', { ascending: false })

  return (
    <div className="px-4 pt-6 pb-28">
      <h1 className="text-2xl font-black text-dark-100 tracking-tight mb-1">Rankings 🏆</h1>
      <p className="text-dark-400 text-xs uppercase tracking-widest mb-6">Sorted by Elo rating</p>

      {/* Info Card */}
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4 mb-6 neon-card">
        <div className="flex gap-3">
          <div className="text-xl flex-shrink-0">💡</div>
          <div>
            <h2 className="text-sm font-bold text-dark-100 mb-2 uppercase tracking-wide">How Ratings Work</h2>
            <p className="text-xs text-dark-400 leading-relaxed">
              Everyone starts at a baseline rating. When you win, you gain points; when you lose, you lose some. The bigger the upset (beating someone way better than you), the bigger the swing. The more you play, the more your rating settles into your true skill level. In doubles, all four players' ratings adjust equally.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {players?.map((player, i) => {
          const isMe = player.id === user.id
          const total = player.wins + player.losses
          const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

          return (
            <Link key={player.id} href={`/profile/${player.id}`}>
              <div className={`rounded-2xl p-4 flex items-center gap-3 border neon-card transition-all ${
                isMe
                  ? 'bg-dark-700 neon-border border-2'
                  : 'bg-dark-800 border-dark-600'
              }`}>
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-black text-dark-500">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  isMe
                    ? 'bg-brand-600 text-dark-900 neon-btn'
                    : 'bg-dark-700 text-dark-300 border border-dark-600'
                }`}>
                  {(player.full_name?.[0] ?? player.username?.[0] ?? '?').toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-dark-100 text-sm truncate">
                      {player.full_name ?? player.username}
                      {isMe && <span className="ml-1 text-xs" style={{ color: '#39FF14' }}>(you)</span>}
                    </p>
                    {/* Streak indicator */}
                    {(player.current_streak ?? 0) >= 3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{
                        color: '#39FF14',
                        background: 'rgba(57,255,20,0.08)',
                        border: '1px solid rgba(57,255,20,0.3)',
                        textShadow: '0 0 6px rgba(57,255,20,0.5)'
                      }}>
                        🔥{player.current_streak}
                      </span>
                    )}
                    {(player.current_streak ?? 0) <= -3 && (
                      <span className="text-xs bg-red-600/10 text-red-400 border border-red-600/30 px-1.5 py-0.5 rounded-full font-bold">
                        😤{Math.abs(player.current_streak)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-400 mt-0.5">{player.wins}W–{player.losses}L · {winRate}%</p>
                </div>

                {/* Elo */}
                <div className="text-right flex items-center gap-2 shrink-0">
                  <div>
                    <p className="font-black text-lg neon-text leading-none">{player.elo_rating}</p>
                    <p className="text-[10px] text-dark-500 uppercase tracking-wider mt-0.5">Elo</p>
                  </div>
                  <TierBadge elo={player.elo_rating} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
