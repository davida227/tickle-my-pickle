import { createClient } from '@/lib/supabase/server'
import DeleteMatchButton from '@/components/DeleteMatchButton'

export default async function GamesPage() {
  const supabase = await createClient()

  const { data: games } = await supabase
    .from('games')
    .select(`
      id, format, team1_score, team2_score, played_at, deleted_at,
      game_players(player_id, team, won, elo_change, profile:profiles(full_name, username))
    `)
    .is('deleted_at', null)
    .order('played_at', { ascending: false })
    .limit(50)

  return (
    <div className="px-4 pt-6 pb-28">
      <h1 className="text-2xl font-black text-dark-100 tracking-tight mb-1">Game History</h1>
      <p className="text-dark-400 text-xs uppercase tracking-widest mb-4">Most recent first</p>

      <DeleteMatchButton />

      {!games || games.length === 0 ? (
        <div className="bg-dark-800 rounded-2xl p-6 text-center text-dark-400 border border-dark-700 neon-card mt-4">
          <p className="text-3xl mb-2">🥒</p>
          <p className="text-sm">No games yet — log your first one!</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {games.map((game: any) => {
            const team1 = game.game_players?.filter((gp: any) => gp.team === 1) ?? []
            const team2 = game.game_players?.filter((gp: any) => gp.team === 2) ?? []
            const team1Won = game.team1_score > game.team2_score

            const playerName = (gp: any) =>
              gp.profile?.full_name?.split(' ')[0] ?? gp.profile?.username ?? '?'

            const team1Names = team1.map(playerName).join(' & ')
            const team2Names = team2.map(playerName).join(' & ')

            const eloChange = Math.abs(team1[0]?.elo_change ?? 0)

            const date = new Date(game.played_at)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <div key={game.id} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 neon-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-dark-500 uppercase tracking-wide">{game.format} · {dateStr}</span>
                  <span className="text-xs font-bold text-dark-400">±{eloChange} Elo</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Team 1 */}
                  <div className="flex-1 text-right">
                    <p className={`text-sm font-bold ${team1Won ? 'neon-text-sm' : 'text-dark-300'}`}>
                      {team1Names}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xl font-black ${team1Won ? 'neon-text' : 'text-dark-400'}`}>
                      {game.team1_score}
                    </span>
                    <span className="text-dark-600 font-bold">–</span>
                    <span className={`text-xl font-black ${!team1Won ? 'neon-text' : 'text-dark-400'}`}>
                      {game.team2_score}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${!team1Won ? 'neon-text-sm' : 'text-dark-300'}`}>
                      {team2Names}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
