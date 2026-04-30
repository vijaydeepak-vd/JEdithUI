import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── JEdith semantic brand tokens ────────────────── */
        jedith: {
          forest: "#344620",
          sage: "#eaeedd",
          copper: "#d57a2a",
          "forest-light": "#4e6a2f",
          "forest-dark": "#1a2310",
          "forest-deeper": "#12190b",
        },
        /* ── Full color scales ───────────────────────────── */
        "olive-leaf": {
          50: "#f4f6ee",
          100: "#eaeedd",
          200: "#d5dcbc",
          300: "#c0cb9a",
          400: "#aaba78",
          500: "#95a857",
          600: "#778745",
          700: "#5a6534",
          800: "#3c4323",
          900: "#1e2211",
          950: "#15180c",
        },
        "black-forest": {
          50: "#f3f7ed",
          100: "#e6efdc",
          200: "#cddfb9",
          300: "#b4d095",
          400: "#9cc072",
          500: "#83b04f",
          600: "#698d3f",
          700: "#4e6a2f",
          800: "#344620",
          900: "#1a2310",
          950: "#12190b",
        },
        cornsilk: {
          50: "#fefbe6",
          100: "#fdf7ce",
          200: "#fcef9c",
          300: "#fae76b",
          400: "#f9df39",
          500: "#f7d708",
          600: "#c6ac06",
          700: "#948105",
          800: "#635603",
          900: "#312b02",
          950: "#231e01",
        },
        "sunlit-clay": {
          50: "#fbf3ea",
          100: "#f6e7d5",
          200: "#edceab",
          300: "#e4b681",
          400: "#db9d57",
          500: "#d2852d",
          600: "#a86a24",
          700: "#7e501b",
          800: "#543512",
          900: "#2a1b09",
          950: "#1d1306",
        },
        copperwood: {
          50: "#fbf2ea",
          100: "#f7e4d4",
          200: "#eecaaa",
          300: "#e6af7f",
          400: "#dd9455",
          500: "#d57a2a",
          600: "#aa6122",
          700: "#804919",
          800: "#553111",
          900: "#2b1808",
          950: "#1e1106",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        // Pure system fonts — no network requests, works behind VPN
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          '"Cascadia Code"',
          '"Fira Code"',
          "Menlo",
          "Consolas",
          '"Courier New"',
          "monospace",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
