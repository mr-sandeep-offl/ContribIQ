/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#262f3f',
          850: '#1b2330',
          950: '#0b0f19',
        }
      }
    },
  },
  plugins: [],
}
