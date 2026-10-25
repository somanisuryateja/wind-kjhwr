/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        hover: 'var(--bg-hover)',
        borderSubtle: 'var(--border-subtle)',
        borderFocus: 'var(--border-focus)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        trading: {
          actual: "#10B981",     // Emerald green for actuals
          forecast: "#F59E0B",   // Amber for Day-Ahead forecast
          intraday: "#8B5CF6",   // Violet for Latest forecast
          shortfall: "#EF4444",  // Red for shortfalls / overforecasts
          surplus: "#3B82F6",    // Blue for surplus
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
