/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trading: {
          bg: "#0B0F17",
          card: "#111827",
          cardBorder: "#1F2937",
          accent: "#3B82F6",
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
