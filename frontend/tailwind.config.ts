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
        // ─── Palette Spinmylunch ───────────────────────────────────────────
        primary: {
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
        // ─── Surfaces dark mode (purple-tinted) ───────────────────────────
        dark: {
          bg:      "#0D0614",
          surface: "#160A2A",
          card:    "#1E0F3A",
          border:  "#2D1B4E",
        },
      },

      fontFamily: {
        title:  ["Nunito", "sans-serif"],
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
          "0%, 100%": { boxShadow: "0 0 20px #7C3AED60, 0 0 40px #7C3AED20" },
          "50%":      { boxShadow: "0 0 40px #7C3AED99, 0 0 80px #7C3AED40" },
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
        "glow-primary":   "0 0 30px rgba(124,58,237,0.55), 0 0 60px rgba(124,58,237,0.2)",
        "glow-secondary": "0 0 30px rgba(255,215,0,0.55)",
        "glow-accent":    "0 0 30px rgba(255,107,53,0.55)",
        "card-dark":      "0 8px 32px rgba(0,0,0,0.5)",
        "card-pop":       "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.25)",
        "btn-primary":    "0 4px 20px rgba(124,58,237,0.5), 0 2px 6px rgba(0,0,0,0.3)",
        "btn-accent":     "0 4px 20px rgba(255,107,53,0.5), 0 2px 6px rgba(0,0,0,0.3)",
      },

      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #7C3AED, #A855F7)",
        "gradient-accent":  "linear-gradient(135deg, #FF6B35, #FF8C42)",
        "gradient-dark":    "linear-gradient(135deg, #0D0614, #160A2A)",
        "gradient-hero":    "radial-gradient(ellipse at top, #1E0F3A 0%, #0D0614 70%)",
        "gradient-card":    "linear-gradient(135deg, #2D1B69, #1E0F3A)",
      },
    },
  },
  plugins: [],
};

export default config;
