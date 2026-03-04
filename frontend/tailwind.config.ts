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
        // ─── Palette SpinMyLunch ───────────────────────────────────────────
        primary: {
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
        secondary: {
          DEFAULT: "#FFD700",
          50:  "#FFFDE7",
          100: "#FFF9C4",
          200: "#FFF176",
          300: "#FFEE58",
          400: "#FFEA00",
          500: "#FFD700",
          600: "#FFB300",
          700: "#FF8F00",
          800: "#FF6F00",
          900: "#E65100",
        },
        accent: {
          DEFAULT: "#7C3AED",
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        // ─── Surfaces dark mode ────────────────────────────────────────────
        dark: {
          bg:      "#1A1A2E",
          surface: "#16213E",
          card:    "#0F3460",
          border:  "#1E2A4A",
        },
      },

      fontFamily: {
        title: ["Space Grotesk", "sans-serif"],
        body:  ["Inter", "sans-serif"],
        accent:["Outfit", "sans-serif"],
      },

      animation: {
        "spin-slow":     "spin 3s linear infinite",
        "pulse-glow":    "pulseGlow 1s ease-in-out infinite",
        "bounce-in":     "bounceIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)",
        "flame":         "flame 1.2s ease-in-out infinite alternate",
        "streak-flash":  "streakFlash 0.5s ease-in-out",
      },

      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px #FF6B35, 0 0 20px #FF6B3540" },
          "50%":      { boxShadow: "0 0 20px #FF6B35, 0 0 40px #FF6B3580" },
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
      },

      boxShadow: {
        "glow-primary":   "0 0 20px rgba(255,107,53,0.5)",
        "glow-secondary": "0 0 20px rgba(255,215,0,0.5)",
        "glow-accent":    "0 0 20px rgba(124,58,237,0.5)",
        "card-dark":      "0 4px 24px rgba(0,0,0,0.4)",
      },

      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #FF6B35, #FFD700)",
        "gradient-dark":    "linear-gradient(135deg, #1A1A2E, #16213E)",
      },
    },
  },
  plugins: [],
};

export default config;
