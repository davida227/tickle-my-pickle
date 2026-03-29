'use client'

interface TierBadgeProps {
  elo: number
}

export default function TierBadge({ elo }: TierBadgeProps) {
  let tier: string
  let style: string

  if (elo <= 750) {
    tier = 'D'
    style = 'bg-zinc-700 text-zinc-300 border border-zinc-600'
  } else if (elo <= 850) {
    tier = 'C'
    style = 'bg-blue-900/60 text-blue-300 border border-blue-600/50'
  } else if (elo <= 950) {
    tier = 'B'
    style = 'bg-amber-900/60 text-amber-300 border border-amber-600/50'
  } else if (elo <= 1050) {
    tier = 'A'
    // neon green glow for A tier
    style = 'text-[#39FF14] border border-[#39FF14]/50 bg-[#39FF14]/10'
  } else {
    tier = 'S'
    // purple glow for S tier
    style = 'text-purple-300 border border-purple-500/60 bg-purple-900/30'
  }

  return (
    <span
      className={`${style} px-2 py-0.5 rounded-full text-xs font-bold`}
      style={tier === 'A' ? { textShadow: '0 0 6px rgba(57,255,20,0.7)' } : tier === 'S' ? { textShadow: '0 0 6px rgba(168,85,247,0.7)' } : undefined}
    >
      {tier}
    </span>
  )
}
