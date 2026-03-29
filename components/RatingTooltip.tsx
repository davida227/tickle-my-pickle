'use client'

import { useState } from 'react'

export default function RatingTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  const tooltipText = "Your rating goes up when you win (especially against stronger players) and down when you lose. It's like a skill score that reflects who you've beaten and how often you win."

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1.5 text-dark-400 hover:text-dark-200 transition-colors text-sm"
        aria-label="Rating explanation"
      >
        ℹ️
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Tooltip popover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-dark-900 border border-dark-700 rounded-lg p-3 w-56 shadow-lg">
            <p className="text-xs text-dark-100 leading-relaxed">{tooltipText}</p>
            {/* Caret pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-dark-900 border-r border-b border-dark-700 rotate-45" />
          </div>
        </>
      )}
    </div>
  )
}
