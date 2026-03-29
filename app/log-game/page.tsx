'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateSinglesElo, calculateDoublesElo } from '@/lib/elo'
import { checkNewAchievements } from '@/lib/achievements'

type Player = {
  id: string
  username: string
  full_name: string
  elo_rating: number
  wins: number
  losses: number
  current_streak: number
  longest_streak: number
}

export default function LogGamePage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<Player | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [format, setFormat] = useState<'singles' | 'doubles'>('doubles')

  // Dropdowns: up to 2 per team, singles uses only slot [0]
  const [team1, setTeam1] = useState<[string, string]>(['', ''])
  const [team2, setTeam2] = useState<[string, string]>(['', ''])

  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: players } = await supabase
        .from('profiles')
        .select('id, username, full_name, elo_rating, wins, losses, current_streak, longest_streak')
        .order('full_name')
      if (players) {
        setAllPlayers(players)
        const me = players.find(p => p.id === user.id) ?? null
        setCurrentUser(me)
        if (me) setTeam1([me.id, ''])
      }
    }
    load()
  }, [])

  // All selected player IDs across both teams (non-empty)
  const allSelected = [...team1, ...team2].filter(Boolean)

  function setTeamSlot(team: 1 | 2, slot: 0 | 1, value: string) {
    const updater = team === 1 ? setTeam1 : setTeam2
    updater(prev => {
      const next: [string, string] = [...prev] as [string, string]
      next[slot] = value
      return next
    })
  }

  // Options for a given slot — exclude players already picked elsewhere (unless it's this slot's current value)
  function optionsFor(team: 1 | 2, slot: 0 | 1): Player[] {
    const currentValue = (team === 1 ? team1 : team2)[slot]
    const otherSelected = allSelected.filter(id => id !== currentValue)
    return allPlayers.filter(p => !otherSelected.includes(p.id))
  }

  function resetTeams() {
    setTeam1([currentUser ? currentUser.id : '', ''])
    setTeam2(['', ''])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const s1 = parseInt(score1), s2 = parseInt(score2)
    if (isNaN(s1) || isNaN(s2)) return setError('Enter valid scores.')
    if (s1 === s2) return setError('Scores cannot be tied.')

    const slotsNeeded = format === 'singles' ? 1 : 2
    const t1 = team1.slice(0, slotsNeeded).filter(Boolean)
    const t2 = team2.slice(0, slotsNeeded).filter(Boolean)

    if (t1.length !== slotsNeeded || t2.length !== slotsNeeded)
      return setError(`Need ${slotsNeeded} player${slotsNeeded > 1 ? 's' : ''} per team.`)

    if (new Set([...t1, ...t2]).size !== t1.length + t2.length)
      return setError('A player cannot be on both teams.')

    setLoading(true)

    const getPlayer = (id: string) => allPlayers.find(p => p.id === id)!
    const team1Won = s1 > s2

    // Calculate Elo changes
    const eloChanges: Record<string, { before: number; change: number; won: boolean }> = {}

    if (format === 'singles') {
      const p1 = getPlayer(t1[0]), p2 = getPlayer(t2[0])
      const result = calculateSinglesElo(p1.elo_rating, p2.elo_rating, team1Won)
      eloChanges[p1.id] = { before: p1.elo_rating, change: result.player1Change, won: team1Won }
      eloChanges[p2.id] = { before: p2.elo_rating, change: result.player2Change, won: !team1Won }
    } else {
      const [p1a, p1b] = [getPlayer(t1[0]), getPlayer(t1[1])]
      const [p2a, p2b] = [getPlayer(t2[0]), getPlayer(t2[1])]
      const result = calculateDoublesElo(
        [p1a.elo_rating, p1b.elo_rating],
        [p2a.elo_rating, p2b.elo_rating],
        team1Won
      )
      eloChanges[p1a.id] = { before: p1a.elo_rating, change: result.team1Change, won: team1Won }
      eloChanges[p1b.id] = { before: p1b.elo_rating, change: result.team1Change, won: team1Won }
      eloChanges[p2a.id] = { before: p2a.elo_rating, change: result.team2Change, won: !team1Won }
      eloChanges[p2b.id] = { before: p2b.elo_rating, change: result.team2Change, won: !team1Won }
    }

    // Insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({ format, team1_score: s1, team2_score: s2, created_by: currentUser?.id })
      .select()
      .single()

    if (gameError || !game) { setError('Failed to save game.'); setLoading(false); return }

    // Insert game_players
    const gamePlayers = [
      ...t1.map(id => ({ game_id: game.id, player_id: id, team: 1, elo_before: eloChanges[id].before, elo_change: eloChanges[id].change, won: eloChanges[id].won })),
      ...t2.map(id => ({ game_id: game.id, player_id: id, team: 2, elo_before: eloChanges[id].before, elo_change: eloChanges[id].change, won: eloChanges[id].won })),
    ]

    const { error: gpError } = await supabase.from('game_players').insert(gamePlayers)
    if (gpError) { setError('Failed to save players.'); setLoading(false); return }

    // Average opponent Elo per team (for upset artist achievement)
    const team1AvgElo = t1.reduce((sum, id) => sum + getPlayer(id).elo_rating, 0) / t1.length
    const team2AvgElo = t2.reduce((sum, id) => sum + getPlayer(id).elo_rating, 0) / t2.length

    // Fetch already-earned achievements for all participants
    const allIds = [...t1, ...t2]
    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('player_id, achievement_key')
      .in('player_id', allIds)

    const alreadyEarnedByPlayer: Record<string, string[]> = {}
    allIds.forEach(id => { alreadyEarnedByPlayer[id] = [] })
    existingAchievements?.forEach(ea => {
      alreadyEarnedByPlayer[ea.player_id]?.push(ea.achievement_key)
    })

    // Update each player
    for (const [playerId, data] of Object.entries(eloChanges)) {
      const player = getPlayer(playerId)
      const newElo = data.before + data.change

      // Update streak: positive = win streak, negative = loss streak
      const prevStreak = player.current_streak ?? 0
      let newStreak: number
      if (data.won) {
        newStreak = prevStreak > 0 ? prevStreak + 1 : 1
      } else {
        newStreak = prevStreak < 0 ? prevStreak - 1 : -1
      }
      const newLongest = Math.max(player.longest_streak ?? 0, newStreak > 0 ? newStreak : 0)
      const totalGames = player.wins + player.losses + 1

      await supabase.from('profiles').update({
        elo_rating: newElo,
        wins: player.wins + (data.won ? 1 : 0),
        losses: player.losses + (data.won ? 0 : 1),
        current_streak: newStreak,
        longest_streak: newLongest,
      }).eq('id', playerId)

      // Which team is this player on, and what's the opponent avg?
      const isTeam1 = t1.includes(playerId)
      const opponentAvgElo = isTeam1 ? team2AvgElo : team1AvgElo

      const newAchievements = checkNewAchievements({
        wonGame: data.won,
        prevWins: player.wins,
        prevStreak,
        newStreak,
        newElo,
        prevElo: data.before,
        totalGames,
        opponentEloAvg: opponentAvgElo,
        alreadyEarned: alreadyEarnedByPlayer[playerId] ?? [],
      })

      if (newAchievements.length > 0) {
        await supabase.from('achievements').insert(
          newAchievements.map(key => ({ player_id: playerId, achievement_key: key }))
        )
      }
    }

    router.push('/')
    router.refresh()
  }

  function PlayerDropdown({
    team,
    slot,
    label,
  }: {
    team: 1 | 2
    slot: 0 | 1
    label: string
  }) {
    const value = (team === 1 ? team1 : team2)[slot]
    const options = optionsFor(team, slot)

    return (
      <div>
        <label className="block text-xs text-dark-400 mb-1.5 font-medium">{label}</label>
        <div className="relative">
          <select
            value={value}
            onChange={e => setTeamSlot(team, slot, e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 text-dark-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none pr-8"
          >
            <option value="">— Select player —</option>
            {options.map(player => (
              <option key={player.id} value={player.id}>
                {player.full_name ?? player.username}
                {player.id === currentUser?.id ? ' (me)' : ''}
                {' '}· {player.elo_rating} Elo
              </option>
            ))}
          </select>
          {/* Chevron */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs">▾</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <h1 className="text-2xl font-black text-dark-100 tracking-tight mb-1">Log a Game</h1>
      <p className="text-dark-400 text-xs uppercase tracking-widest mb-6">Record your match results</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Format toggle */}
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-600 neon-card">
          <p className="text-sm font-semibold text-dark-300 mb-3">Format</p>
          <div className="flex rounded-xl bg-dark-700 p-1">
            {(['singles', 'doubles'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { setFormat(f); resetTeams() }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  format === f ? 'bg-dark-800 shadow text-dark-100' : 'text-dark-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Player selection */}
        <div className="bg-dark-800 rounded-2xl p-4 shadow-sm border border-dark-700 space-y-4">
          {/* Team 1 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-dark-300">
              Team 1 {format === 'doubles' && <span className="text-dark-500 font-normal">(pick 2)</span>}
            </p>
            <PlayerDropdown team={1} slot={0} label={format === 'doubles' ? 'Player A' : 'Player'} />
            {format === 'doubles' && (
              <PlayerDropdown team={1} slot={1} label="Player B" />
            )}
          </div>

          <div className="border-t border-dark-700" />

          {/* Team 2 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-dark-300">
              Team 2 {format === 'doubles' && <span className="text-dark-500 font-normal">(pick 2)</span>}
            </p>
            <PlayerDropdown team={2} slot={0} label={format === 'doubles' ? 'Player A' : 'Player'} />
            {format === 'doubles' && (
              <PlayerDropdown team={2} slot={1} label="Player B" />
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-600 neon-card">
          <p className="text-sm font-semibold text-dark-300 mb-3">Score</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-dark-400 mb-1 text-center">Team 1</p>
              <input
                type="number"
                value={score1}
                onChange={e => setScore1(e.target.value)}
                min="0"
                max="99"
                placeholder="0"
                className="w-full text-center text-3xl font-bold border-2 border-dark-600 rounded-xl py-3 bg-dark-900 text-dark-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-2xl font-bold text-dark-500">–</span>
            <div className="flex-1">
              <p className="text-xs text-dark-400 mb-1 text-center">Team 2</p>
              <input
                type="number"
                value={score2}
                onChange={e => setScore2(e.target.value)}
                min="0"
                max="99"
                placeholder="0"
                className="w-full text-center text-3xl font-bold border-2 border-dark-600 rounded-xl py-3 bg-dark-900 text-dark-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-dark-900 py-4 rounded-2xl font-black uppercase tracking-widest neon-btn active:bg-brand-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Game & Update Ratings'}
        </button>
      </form>
    </div>
  )
}
