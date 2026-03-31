import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import RatingTooltip from '@/components/RatingTooltip'
import DeleteMatchButton from '@/components/DeleteMatchButton'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: rawGamePlayers } = await supabase
    .from('game_players')
    .select(`
      elo_before, elo_change, won, team,
      game:games(id, format, team1_score, team2_score, played_at, deleted_at,
        game_players(player_id, team, profile:profiles(username, full_name))
      )
    `)
    .eq('player_id', user.id)
    .order('id', { ascending: false })
    .limit(20)

  // Exclude soft-deleted games
  const recentGamePlayers = (rawGamePlayers ?? [])
    .filter((gp: any) => gp.game?.deleted_at === null || gp.game?.deleted_at === undefined)
    .slice(0, 5)

  const winRate = profile && (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0

  const streak: number = profile?.current_streak ?? 0

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 tracking-tight">
            Hey, {profile?.full_name?.split(' ')[0] ?? 'Player'} 👋
          </h1>
          <p className="text-dark-400 text-sm uppercase tracking-widest mt-0.5">Ready to play?</p>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-dark-900 font-black text-lg neon-btn">
          {(profile?.full_name?.[0] ?? profile?.username?.[0] ?? '?').toUpperCase()}
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-dark-800 rounded-2xl p-4 shadow-sm text-center border border-dark-700 neon-card">
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-black neon-text">{profile?.elo_rating ?? 1000}</p>
            <TierBadge elo={profile?.elo_rating ?? 1000} />
          </div>
          <div className="flex items-center justify-center">
            <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">Elo</p>
            <RatingTooltip />
          </div>
        </div>
        <div className="bg-dark-800 rounded-2xl p-4 shadow-sm text-center border border-dark-700 neon-card">
          <p className="text-2xl font-black text-dark-100">
            {profile?.wins ?? 0}–{profile?.losses ?? 0}
          </p>
          <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">W–L</p>
        </div>
        <div className="bg-dark-800 rounded-2xl p-4 shadow-sm text-center border border-dark-700 neon-card">
          <p className="text-2xl font-black text-dark-100">{winRate}%</p>
          <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">Win Rate</p>
        </div>
      </div>

      {/* Streak callout — only show if on a streak */}
      {streak >= 2 && (
        <div className="mb-6 rounded-2xl px-4 py-3 border neon-border flex items-center gap-3" style={{ background: 'rgba(57,255,20,0.04)' }}>
          <span className="text-2xl">{streak >= 5 ? '🌋' : '🔥'}</span>
          <div>
            <p className="text-sm font-bold neon-text-sm">{streak}-game win streak!</p>
            <p className="text-xs text-dark-400">Keep it going.</p>
          </div>
        </div>
      )}
      {streak <= -2 && (
        <div className="mb-6 rounded-2xl px-4 py-3 border border-red-600/40 flex items-center gap-3" style={{ background: 'rgba(220,38,38,0.05)' }}>
          <span className="text-2xl">😤</span>
          <div>
            <p className="text-sm font-bold text-red-400">{Math.abs(streak)}-game skid. Bounce back.</p>
            <p className="text-xs text-dark-400">You got this.</p>
          </div>
        </div>
      )}

      {/* Log game CTA */}
      <Link
        href="/log-game"
        className="block w-full bg-brand-600 text-dark-900 text-center py-4 rounded-2xl font-black text-base uppercase tracking-widest mb-6 neon-btn transition-all active:bg-brand-700"
      >
        ➕ Log a Game
      </Link>

      {/* Recent games */}
      <div>
        <h2 className="text-sm font-bold text-dark-400 uppercase tracking-widest mb-3">Recent Games</h2>
        {!recentGamePlayers || recentGamePlayers.length === 0 ? (
          <div className="bg-dark-800 rounded-2xl p-6 text-center text-dark-400 border border-dark-700 neon-card">
            <p className="text-3xl mb-2">🥒</p>
            <p className="text-sm">No games yet — log your first one!</p>
          </div>
        ) : (
          <>
          <DeleteMatchButton />
          <div className="space-y-3">
            {recentGamePlayers.map((gp: any) => {
              const game = gp.game
              const won = gp.won
              const eloChange = gp.elo_change
              const opponents = game.game_players
                ?.filter((p: any) => p.team !== gp.team)
                .map((p: any) => p.profile?.full_name?.split(' ')[0] ?? p.profile?.username)
                .join(' & ')

              return (
                <div key={game.id} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 neon-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                      won
                        ? 'bg-brand-600 text-dark-900'
                        : 'bg-red-600/20 text-red-400 border border-red-600/40'
                    }`}>
                      {won ? 'W' : 'L'}
                    </div>
                    <div>
                      <p className="font-bold text-dark-100 text-sm">
                        {game.team1_score}–{game.team2_score}
                        <span className="font-normal text-dark-400 ml-1 text-xs uppercase tracking-wide">· {game.format}</span>
                      </p>
                      <p className="text-xs text-dark-400">vs {opponents ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${eloChange >= 0 ? 'neon-text-sm' : 'text-red-400'}`}>
                    {eloChange >= 0 ? '+' : ''}{eloChange}
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
