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
        sans: ['Inter', '"Anek Malayalam"', '"Noto Sans Malayalam"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        malayalam: ['"Anek Malayalam"', '"Noto Sans Malayalam"', 'sans-serif'],
        'anek-malayalam': ['"Anek Malayalam"', 'sans-serif'],
        heading: ['Poppins', '"Anek Malayalam"', '"Noto Sans Malayalam"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config