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
        },
        border: { DEFAULT: '#1e1e1e', muted: '#252525' },
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          muted: 'rgba(249,115,22,0.15)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
