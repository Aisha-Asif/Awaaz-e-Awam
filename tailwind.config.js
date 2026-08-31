/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12302B",
        "ink-2": "#0C2420",
        paper: "#FBF6EA",
        "paper-card": "#FFFDF6",
        line: "#E4D9BC",
        marigold: "#E29A34",
        rani: "#B23A32",
        jade: "#4F8F6D",
        text: "#182420",
        "text-muted": "#5B685F",
        "on-ink": "#F4EFDD",
        "on-ink-muted": "#B9CDC3",
      },
      fontFamily: {
        display: ["Lora", "serif"],
        body: ["Work Sans", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
      borderRadius: {
        card: "18px",
      }
    },
  },
  plugins: [],
};
