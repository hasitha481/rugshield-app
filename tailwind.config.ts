// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0B0E',
          secondary: '#13151A',
          tertiary: '#1C1F26',
        },
        accent: {
          green: '#10B981',
          yellow: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          violet: '#8B5CF6',
        },
        text: {
          primary: '#F4F4F5',
          secondary: '#9CA3AF',
        },
      },
      // `border` (the Tailwind utility) defaults to this color so plain
      // `<div className="border">` produces the correct theme stroke.
      borderColor: {
        DEFAULT: '#2A2D36',
      },
      ringColor: {
        DEFAULT: '#8B5CF6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 0 0 rgba(255,255,255,0.02), 0 8px 24px -8px rgba(0,0,0,0.6)',
        'glow-violet': '0 0 0 1px rgba(139,92,246,0.4), 0 0 24px -4px rgba(139,92,246,0.45)',
        'glow-green': '0 0 0 1px rgba(16,185,129,0.4), 0 0 24px -4px rgba(16,185,129,0.45)',
        'glow-red': '0 0 0 1px rgba(239,68,68,0.4), 0 0 24px -4px rgba(239,68,68,0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;