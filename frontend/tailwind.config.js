/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Potta One', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
      "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translate(-50%, -20px)" },
          "100%": { opacity: 1, transform: "translate(-50%, 0)" },
        },
      },
    },
  },
  plugins: [],
}