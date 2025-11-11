/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EdTech primary colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Main blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e293b',
        },
        // Conservation status colors
        status: {
          critical: '#dc2626',    // Red
          watch: '#f59e0b',       // Amber/Yellow
          good: '#16a34a',        // Green
        },
        critical: '#dc2626',    // Red (legacy)
        watch: '#f59e0b',       // Amber/Yellow (legacy)
        good: '#16a34a',        // Green (legacy)
        // Accent colors
        accent: {
          cyan: '#06b6d4',
          yellow: '#fbbf24',
          green: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'Nunito Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
