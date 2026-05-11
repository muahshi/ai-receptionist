/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#f5c842",
          500: "#D4AF37",
          600: "#b8960c",
          700: "#926e0a",
          800: "#785a12",
          900: "#654a14",
        },
        charcoal: {
          900: "#0a0a0a",
          800: "#121212",
          700: "#1a1a1a",
          600: "#242424",
          500: "#2e2e2e",
          400: "#3a3a3a",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "scan-line": "scanLine 2s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "lock-seal": "lockSeal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "glow": "glow 3s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%, 100%": { top: "0%" },
          "50%": { top: "90%" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 5px #D4AF37, 0 0 10px #D4AF37" },
          "50%": { boxShadow: "0 0 20px #D4AF37, 0 0 40px #D4AF37, 0 0 60px #D4AF37" },
        },
        fadeInUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        lockSeal: {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: 0 },
          "70%": { transform: "scale(1.2) rotate(10deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
        },
        glow: {
          from: { textShadow: "0 0 5px #D4AF37, 0 0 10px #D4AF37" },
          to: { textShadow: "0 0 10px #D4AF37, 0 0 20px #D4AF37, 0 0 30px #D4AF37" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
