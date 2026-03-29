'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',            label: 'Home',       icon: '🥒' },
  { href: '/log-game',   label: 'Log Game',   icon: '➕' },
  { href: '/leaderboard', label: 'Rankings',   icon: '🏆' },
  { href: '/profile',    label: 'Profile',    icon: '👤' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t-2 border-brand-600 z-50 pb-safe neon-nav-glow">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-semibold tracking-wide uppercase transition-all ${
                active ? 'neon-text-sm' : 'text-dark-400'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
