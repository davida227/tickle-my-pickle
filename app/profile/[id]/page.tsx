import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import RatingTooltip from '@/components/RatingTooltip'
import { AchievementGrid } from '@/components/AchievementBadge'

function StreakBadge({ streak }: { streak: number }) {
  if (!streak || streak === 0) return null
  const isWin = streak > 0
  const count = Math.abs(streak)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isWin ? 'bg-brand-600/15 text-brand-500 border border-brand-600/30' : 'bg-red-600/15 text-red-400 border border-red-600/30'
    }`}>
      {isWin ? '🔥' : '😤'} {count}-game {isWin ? 'win' : 'loss'} streak
    </span>
  )
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileId = id === 'me' || !id ? user.id : id

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile) redirect('/')

  // Fetch achievements
  const { data: earnedAchievements } = await supabase
    .from('achievements')
    .select('achievement_key, earned_at')
    .eq('player_id', profileId)
    .order('earned_at', { ascending: true })

  const earnedKeys = earnedAchievements?.map(a => a.achievement_key) ?? []

  // All games this player was in (fetch extra to account for soft-deleted games)
  const { data: rawGamePlayers } = await supabase
    .from('game_players')
    .select(`
      elo_before, elo_change, won, team,
      game:games(id, format, team1_score, team2_score, played_at, deleted_at,
        game_players(player_id, team, won, profile:profiles(id, username, full_name))
      )
    `)
    .eq('player_id', profileId)
    .order('id', { ascending: false })
    .limit(40)

  // Exclude soft-deleted games
  const gamePlayers = (rawGamePlayers ?? [])
    .filter((gp: any) => gp.game?.deleted_at === null || gp.game?.deleted_at === undefined)
    .slice(0, 20)

  // Build head-to-head stats
  const h2h: Record<string, { name: string; wins: number; losses: number }> = {}
  gamePlayers?.forEach((gp: any) => {
    const game = gp.game
    const opponents = game.game_players?.filter((p: any) => p.team !== gp.team && p.player_id !== profileId)
    opponents?.forEach((opp: any) => {
      const oppId = opp.player_id
      const oppName = opp.profile?.full_name ?? opp.profile?.username ?? 'Unknown'
      if (!h2h[oppId]) h2h[oppId] = { name: oppName, wins: 0, losses: 0 }
      if (gp.won) h2h[oppId].wins++
      else h2h[oppId].losses++
    })
  })

  const isMe = profileId === user.id
  const total = profile.wins + profile.losses
  const winRate = total > 0 ? Math.round((profile.wins / total) * 100) : 0
  const currentStreak: number = profile.current_streak ?? 0
  const longestStreak: number = profile.longest_streak ?? 0

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-dark-100 tracking-tight">{isMe ? 'My Profile' : 'Player'}</h1>
        {isMe && (
          <form action={signOut}>
            <button type="submit" className="text-sm text-dark-400 underline">Sign out</button>
          </form>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-dark-800 rounded-2xl p-5 mb-4 border border-dark-600 neon-card">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-dark-900 text-2xl font-black shrink-0 neon-btn">
            {(profile.full_name?.[0] ?? profile.username?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-100">{profile.full_name ?? profile.username}</h2>
            <p className="text-dark-400 text-sm">@{profile.username}</p>
          </div>
        </div>
        {/* Streak badge */}
        {currentStreak !== 0 && (
          <StreakBadge streak={currentStreak} />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-dark-800 rounded-2xl p-4 text-center border border-dark-600 neon-card">
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-black neon-text">{profile.elo_rating}</p>
            <TierBadge elo={profile.elo_rating} />
          </div>
          <div className="flex items-center justify-center gap-1">
            <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">Elo</p>
            <RatingTooltip />
          </div>
        </div>
        <div className="bg-dark-800 rounded-2xl p-4 text-center border border-dark-600 neon-card">
          <p className="text-2xl font-black text-dark-100">{profile.wins}–{profile.losses}</p>
          <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">W–L</p>
        </div>
        <div className="bg-dark-800 rounded-2xl p-4 text-center border border-dark-600 neon-card">
          <p className="text-2xl font-black text-dark-100">{winRate}%</p>
          <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">Win Rate</p>
        </div>
        <div className="bg-dark-800 rounded-2xl p-4 text-center border border-dark-600 neon-card">
          <p className="text-2xl font-black neon-text-sm">{longestStreak}</p>
          <p className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">Best Streak 🔥</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-4">
        <AchievementGrid earned={earnedKeys} />
      </div>

      {/* Head-to-head */}
      {Object.keys(h2h).length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-dark-100 mb-3">Head-to-Head</h3>
          <div className="space-y-2">
            {Object.entries(h2h)
              .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
              .map(([oppId, data]) => {
                const total = data.wins + data.losses
                const pct = Math.round((data.wins / total) * 100)
                return (
                  <Link key={oppId} href={`/profile/${oppId}`}>
                    <div className="bg-dark-800 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between border border-dark-700">
                      <div>
                        <p className="font-semibold text-dark-100 text-sm">{data.name}</p>
                        <p className="text-xs text-dark-400">{data.wins}W – {data.losses}L</p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 50 ? 'text-brand-600' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      )}

      {/* Game history */}
      <div>
        <h3 className="text-lg font-bold text-dark-100 mb-3">Game History</h3>
        {!gamePlayers || gamePlayers.length === 0 ? (
          <div className="bg-dark-800 rounded-2xl p-6 text-center text-dark-400 shadow-sm border border-dark-700">
            <p className="text-3xl mb-2">🥒</p>
            <p className="text-sm">No games yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gamePlayers.map((gp: any) => {
              const game = gp.game
              const eloAfter = gp.elo_before + gp.elo_change
              const opponents = game.game_players
                ?.filter((p: any) => p.team !== gp.team)
                .map((p: any) => p.profile?.full_name?.split(' ')[0] ?? p.profile?.username)
                .join(' & ')
              return (
                <div key={game.id} className="bg-dark-800 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${gp.won ? 'bg-brand-600' : 'bg-red-600'}`}>
                      {gp.won ? 'W' : 'L'}
                    </div>
                    <div>
                      <p className="font-semibold text-dark-100 text-sm">
                        {game.team1_score}–{game.team2_score}
                        <span className="font-normal text-dark-400 ml-1">· {game.format}</span>
                      </p>
                      <p className="text-xs text-dark-400">vs {opponents ?? '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${gp.elo_change >= 0 ? 'text-brand-600' : 'text-red-400'}`}>
                      {gp.elo_change >= 0 ? '+' : ''}{gp.elo_change}
                    </p>
                    <p className="text-xs text-dark-400">{eloAfter} Elo</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
