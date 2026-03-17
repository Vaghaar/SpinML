import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Palette Spinmylunch (inspiré pickthewheel) ───────────────────
        primary: {
          DEFAULT: "#F82F77",
          50:  "#FFF0F6",
          100: "#FFD6E8",
          200: "#FFB3D0",
          300: "#FF80B0",
          400: "#FF4D90",
          500: "#F82F77",
          600: "#D91A5F",
          700: "#B5084A",
          800: "#900038",
          900: "#70002B",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        accent: {
          DEFAULT: "#FF6B35",
          50:  "#FFF4EF",
          100: "#FFE3D4",
          200: "#FFC4A8",
          300: "#FFA07D",
          400: "#FF8152",
          500: "#FF6B35",
          600: "#E54E18",
          700: "#C03D10",
          800: "#9A2F0C",
          900: "#7A2409",
        },
        // ─── Surfaces adaptatives (light/dark via CSS var) ────────────────
        dark: {
          bg:      "var(--color-bg)",
          surface: "var(--color-surface)",
          card:    "var(--color-card)",
          border:  "var(--color-border)",
        },
      },

      fontFamily: {
        title:  ["Roboto Slab", "serif"],
        body:   ["Nunito", "sans-serif"],
        accent: ["Nunito", "sans-serif"],
      },

      animation: {
        "spin-slow":    "spin 3s linear infinite",
        "pulse-glow":   "pulseGlow 1.8s ease-in-out infinite",
        "bounce-in":    "bounceIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)",
        "flame":        "flame 1.2s ease-in-out infinite alternate",
        "streak-flash": "streakFlash 0.5s ease-in-out",
        "float":        "float 3s ease-in-out infinite",
        "pop":          "pop 0.35s cubic-bezier(0.68,-0.55,0.265,1.55)",
      },

      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px #F82F7755, 0 0 40px #F82F7720" },
          "50%":      { boxShadow: "0 0 40px #F82F7799, 0 0 80px #F82F7740" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0)" },
          "60%":  { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        flame: {
          "0%":   { transform: "scaleY(1) rotate(-3deg)" },
          "100%": { transform: "scaleY(1.2) rotate(3deg)" },
        },
        streakFlash: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        pop: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },

      boxShadow: {
        "glow-primary":   "0 0 30px rgba(248,47,119,0.55), 0 0 60px rgba(248,47,119,0.2)",
        "glow-secondary": "0 0 30px rgba(6,182,212,0.55)",
        "glow-accent":    "0 0 30px rgba(255,107,53,0.55)",
        "card-dark":      "0 8px 32px rgba(0,0,0,0.6)",
        "card-pop":       "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(248,47,119,0.25)",
        "btn-primary":    "0 4px 20px rgba(248,47,119,0.5), 0 2px 6px rgba(0,0,0,0.4)",
        "btn-accent":     "0 4px 20px rgba(255,107,53,0.5), 0 2px 6px rgba(0,0,0,0.4)",
        "btn-secondary":  "0 4px 20px rgba(6,182,212,0.5), 0 2px 6px rgba(0,0,0,0.4)",
      },

      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #F82F77, #FF6B9D)",
        "gradient-accent":  "linear-gradient(135deg, #FF6B35, #FF8C42)",
        "gradient-dark":    "linear-gradient(135deg, #06020C, #0D0614)",
        "gradient-hero":    "radial-gradient(ellipse at top, #140920 0%, #06020C 70%)",
        "gradient-card":    "linear-gradient(135deg, #140920, #0D0614)",
      },
    },
  },
  plugins: [],
};

export default config;
