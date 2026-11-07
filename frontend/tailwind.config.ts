import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        foreground: "var(--text-main)",
        purple: {
          50: "#f6f0ff",
          100: "#ede2fe",
          200: "#dcc7fd",
          300: "#c29dfc",
          400: "#9f63fb",
          500: "#7305FA", // Custom Electric Purple requested by user
          600: "#6204d8",
          700: "#4f03ad",
          800: "#3d0285",
          900: "#2a015e",
          950: "#180039",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#0e1526",
          900: "#090d19",
          950: "#05070f",
        },
        brand: {
          cyan: "#00F0FF",
          indigo: "#6366F1",
          violet: "#8B5CF6",
          purple: "#7305FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        editorial: ["var(--font-serif-heading)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-flow": "glow 8s ease infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "0.4", filter: "blur(20px)" },
          "50%": { opacity: "0.8", filter: "blur(28px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
