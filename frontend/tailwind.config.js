/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d2c1a1',
          light: '#e8e4dc',
          dark: '#c7b291',
        },
        accent: '#c7b291',
        neutral: {
          light: '#e8e4dc',
          dark: '#3a2e1f',
          input: '#e4e0d0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

