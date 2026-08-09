/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#221d1a",
        raised: "#2c2521",
        clay: "#b5563c",
        clayBright: "#d4674a",
        brass: "#c99a3a",
        indigo: "#3a4a7a",
        ivory: "#f2ece4",
        ivoryDim: "#b8afa4",
        good: "#6f9c6a",
        bad: "#b5563c"
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        tamil: ["Noto Sans Tamil", "sans-serif"]
      }
    }
  },
  plugins: []
};
