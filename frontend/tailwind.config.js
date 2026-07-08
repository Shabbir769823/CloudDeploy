/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable dark mode toggling
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        darkCard: '#151c2c',
        neonBlue: '#00f0ff',
        neonPurple: '#bd00ff',
        neonGreen: '#39ff14'
      },
      boxShadow: {
        neonBlue: '0 0 15px rgba(0, 240, 255, 0.3)',
        neonPurple: '0 0 15px rgba(189, 0, 255, 0.3)',
        neonGreen: '0 0 15px rgba(57, 255, 20, 0.3)'
      }
    },
  },
  plugins: [],
}
