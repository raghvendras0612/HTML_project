import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
        },
        border: "var(--border)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          glow: "var(--accent-glow)",
          foreground: "var(--accent-foreground)",
        },
        vote: {
          up: "var(--upvote)",
          down: "var(--downvote)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "#0B0D12",
        },
        curia: {
          bg: "#0B0D12",
          surface: "#12151C",
          "surface-raised": "#181C25",
          border: "#232834",
          text: "#E6E9F0",
          muted: "#8B93A7",
          accent: "#7C5CFF",
          "accent-glow": "#22D3EE",
          upvote: "#FF6B3D",
          downvote: "#5B8CFF",
          danger: "#F0506E",
          success: "#2DD4A0",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(124, 92, 255, 0.35)",
        "glow-cyan": "0 0 20px -5px rgba(34, 211, 238, 0.35)",
        "glow-sm": "0 0 10px -2px rgba(124, 92, 255, 0.25)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      transitionDuration: {
        "150": "150ms",
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-in-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
