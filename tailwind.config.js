/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/dist/**/*",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          600: '#0284c7',
          700: '#0369a1',
          900: '#082f49',
        },
        positive: '#22c55e',
        negative: '#ef4444',
      }
    },
  },
  plugins: [],
}
