/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F131B',
          900: '#0B0E14',
          800: '#131826',
          700: '#1A2032',
          600: '#232B41',
          500: '#333D57',
        },
        mist: {
          DEFAULT: '#8A93A8',
          light: '#C7CCDA',
        },
        paper: '#F4F3EE',
        mint: {
          DEFAULT: '#4FD1B5',
          soft: '#173330',
        },
        amber: {
          DEFAULT: '#F0A94E',
          soft: '#332512',
        },
        coral: {
          DEFAULT: '#F0715E',
          soft: '#331E1B',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
