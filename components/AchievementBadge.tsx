'use client'

import { useState } from 'react'
import { ACHIEVEMENTS, getAchievement, type AchievementKey } from '@/lib/achievements'

type Props = {
  achievementKey: AchievementKey
  size?: 'sm' | 'md'
}

export default function AchievementBadge({ achievementKey, size = 'md' }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const achievement = getAchievement(achievementKey)
  if (!achievement) return null

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setShowTooltip(false)}
        className={`flex flex-col items-center justify-center rounded-2xl border border-dark-600 bg-dark-700 transition-all active:scale-95 ${
          size === 'sm' ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-2xl'
        }`}
        title={achievement.name}
      >
        <span>{achievement.emoji}</span>
        {size === 'md' && (
          <span className="text-[9px] text-dark-400 mt-0.5 font-medium leading-none text-center px-1">
            {achievement.name}
          </span>
        )}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-40 bg-dark-900 border border-dark-600 rounded-xl p-2 shadow-xl text-center pointer-events-none">
          <p className="text-xs font-semibold text-dark-100">{achievement.name}</p>
          <p className="text-[10px] text-dark-400 mt-0.5">{achievement.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-600" />
        </div>
      )}
    </div>
  )
}

/** Shows all achievements with locked ones grayed out */
export function AchievementGrid({ earned }: { earned: string[] }) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div className="bg-dark-800 rounded-2xl p-4 shadow-sm border border-dark-700">
      <h3 className="text-sm font-semibold text-dark-300 mb-3">Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENTS.map(a => {
          const unlocked = earned.includes(a.key)
          return (
            <div key={a.key} className="relative">
              <button
                type="button"
                onClick={() => setTooltip(tooltip === a.key ? null : a.key)}
                onBlur={() => setTooltip(null)}
                className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl border transition-all active:scale-95 ${
                  unlocked
                    ? 'border-brand-600/50 bg-brand-600/10 shadow-sm shadow-brand-600/20'
                    : 'border-dark-600 bg-dark-700 opacity-35'
                }`}
              >
                <span className={`text-xl ${!unlocked && 'grayscale'}`}>{a.emoji}</span>
                <span className="text-[8px] text-dark-400 mt-0.5 font-medium leading-none text-center px-0.5">
                  {a.name}
                </span>
              </button>

              {tooltip === a.key && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 bg-dark-900 border border-dark-600 rounded-xl p-2.5 shadow-xl text-center pointer-events-none">
                  <p className="text-xs font-semibold text-dark-100">{a.name} {unlocked ? '✓' : '🔒'}</p>
                  <p className="text-[10px] text-dark-400 mt-0.5">{a.description}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-dark-500 mt-2">{earned.length}/{ACHIEVEMENTS.length} unlocked</p>
    </div>
  )
}
