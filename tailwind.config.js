/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f172a',
        'bg-secondary': '#1e293b',
        'bg-tertiary': '#334155',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'accent-blue': '#3b82f6',
        'accent-green': '#22c55e',
        'accent-red': '#ef4444',
        'accent-yellow': '#eab308',
        'border': '#475569',
      },
    },
  },
  plugins: [],
}
