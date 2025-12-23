/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-bg': '#050103', // Deep black-pink as requested
        'dream-pink': '#F9F1F5', // Almost white pink
        'luxury-pink': '#E8D0D8', // Muted, elegant pink
        'silver': '#E8E8E8',
        'platinum': '#F5F5F7',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        vibes: ['"Great Vibes"', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        }
      }
    },
  },
  plugins: [],
}
