/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    keyframes: {
      fade: {
        "0%": { opacity: 0, transform: "translateY(10px)" },
        "20%": { opacity: 1, transform: "translateY(0px)" },
        "80%": { opacity: 1, transform: "translateY(0px)" },
        "100%": { opacity: 0, transform: "translateY(-10px)" },
      },
    },
    animation: {
      fade: "fade 7s linear infinite",
    },
  },
},
  plugins: [],
};

