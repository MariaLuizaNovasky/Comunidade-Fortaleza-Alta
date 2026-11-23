/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-tema="escuro"]'],
  theme: {
    extend: {
      colors: {
        mata: {
          50: '#edf7f3',
          100: '#d2ece1',
          200: '#a7d8c5',
          300: '#73bda4',
          400: '#459d83',
          500: '#2a8068',
          600: '#1d6753',
          700: '#115e4a',
          800: '#0d4536',
          900: '#0a3328',
          950: '#041e17',
        },
        terra: {
          50: '#fdf8ed',
          100: '#f8ebcd',
          200: '#f0d496',
          300: '#e7b85d',
          400: '#dfa036',
          500: '#c8821f',
          600: '#a66419',
          700: '#854b18',
          800: '#6d3c19',
          900: '#5c3318',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        cartao: '0 1px 2px rgba(10, 51, 40, 0.06), 0 8px 24px -12px rgba(10, 51, 40, 0.18)',
      },
      keyframes: {
        'sobe-suave': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'entra-direita': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'sobe-suave': 'sobe-suave 0.25s ease-out',
        'entra-direita': 'entra-direita 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
