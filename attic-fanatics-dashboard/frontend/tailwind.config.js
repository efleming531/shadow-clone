/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        bg: {
          primary: '#0a0a0a',
          card: '#111111',
          elevated: '#161616',
          hover: '#1a1a1a',
        },
        border: { DEFAULT: '#1e1e1e', muted: '#252525', focus: '#333333' },
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          muted: 'rgba(249,115,22,0.15)',
          subtle: 'rgba(249,115,22,0.08)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#9ca3af',
          muted: '#6b7280',
          inverse: '#0a0a0a',
        },
        status: {
          green: '#22c55e',
          'green-muted': 'rgba(34,197,94,0.15)',
          blue: '#3b82f6',
          'blue-muted': 'rgba(59,130,246,0.15)',
          yellow: '#eab308',
          'yellow-muted': 'rgba(234,179,8,0.15)',
          red: '#ef4444',
          'red-muted': 'rgba(239,68,68,0.15)',
          purple: '#a855f7',
          'purple-muted': 'rgba(168,85,247,0.15)',
          orange: '#f97316',
          'orange-muted': 'rgba(249,115,22,0.15)',
          gray: '#6b7280',
          'gray-muted': 'rgba(107,114,128,0.15)',
        },
        stage: {
          new: '#3b82f6',
          contacted: '#8b5cf6',
          qualified: '#f59e0b',
          estimate: '#f97316',
          negotiating: '#ef4444',
          won: '#22c55e',
          lost: '#6b7280',
          unqualified: '#374151',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateX(16px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(249,115,22,0.15)',
        'glow-green': '0 0 20px rgba(34,197,94,0.15)',
      },
    },
  },
  plugins: [],
};
