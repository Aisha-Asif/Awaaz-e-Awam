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
        ink: "#0F2420",
        "ink-2": "#081A16",
        paper: "#FAF7F0",
        "paper-card": "#FFFFFF",
        "paper-subtle": "#F4EFE2",
        line: "#E3DAC5",
        "line-strong": "#CFBF9F",
        marigold: "#D9822B",
        "marigold-light": "#F7ECCF",
        "marigold-hover": "#C6711D",
        rani: "#B83A32",
        "rani-light": "#FBEAE8",
        jade: "#1E6B4F",
        "jade-light": "#E5F2EC",
        "jade-hover": "#17563E",
        text: "#142521",
        "text-muted": "#566860",
        "on-ink": "#F7F3E6",
        "on-ink-muted": "#B5C8BF",
      },
      fontFamily: {
        display: ["Lora", "Georgia", "serif"],
        body: ["Work Sans", "-apple-system", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
      borderRadius: {
        card: "18px",
        pill: "9999px",
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        waveBar: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
};
