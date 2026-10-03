import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#15664a',
          gold: '#c8a136',
          olive: '#60834f',
          muted: '#7ea99a',
          light: '#eef3f1',
          surface: '#c1d5cd'
        }
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Malayalam"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        heading: ['Poppins', '"Noto Sans Malayalam"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config