import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neon Court: electric lime green
        brand: {
          50:  '#f0ffe8',
          100: '#d4ffb3',
          500: '#39FF14',
          600: '#39FF14',
          700: '#2dd40e',
          800: '#22a30a',
          900: '#147009',
        },
        // Neon Court: deep black/navy backgrounds
        dark: {
          50:  '#e0e0e0',
          100: '#ffffff',   // primary text — pure white
          200: '#dddddd',
          300: '#aaaaaa',   // label text
          400: '#888888',   // secondary / muted text
          500: '#555577',   // placeholder / very muted
          600: '#2a2a3e',   // subtle border / input border
          700: '#1a1a2e',   // slightly lighter cards / toggle bg
          800: '#0f0f1a',   // card background
          900: '#0a0a0a',   // page background
        },
      },
      // Custom glow shadows for neon effect
      boxShadow: {
        'neon':       '0 0 10px rgba(57,255,20,0.5), 0 0 20px rgba(57,255,20,0.2)',
        'neon-sm':    '0 0 6px rgba(57,255,20,0.4)',
        'neon-top':   '0 -4px 20px rgba(57,255,20,0.2)',
        'neon-btn':   '0 4px 20px rgba(57,255,20,0.35)',
        'neon-card':  '0 0 0 1px rgba(57,255,20,0.08), 0 2px 8px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
