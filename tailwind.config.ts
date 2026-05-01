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
        /* ── JEdith semantic brand tokens (Sirius theme) ── */
        jedith: {
          forest: "#693FBD",        /* deep purple — primary brand */
          sage: "#F8F0FF",          /* lavender — light accent */
          copper: "#FF9F66",        /* warm orange — CTAs, highlights */
          "forest-light": "#BA67D3", /* orchid purple — hover state */
          "forest-dark": "#1a1025",  /* deep purple-black — gradient mid */
          "forest-deeper": "#110a1a", /* deepest purple — gradient end */
        },
        /* ── Full color scales ───────────────────────────── */
        "deep-violet": {
          50: "#f8f0ff",
          100: "#f0e0ff",
          200: "#dbb8ff",
          300: "#c68fff",
          400: "#ba67d3",
          500: "#9b4dca",
          600: "#7b3daf",
          700: "#693fbd",
          800: "#4a2d80",
          900: "#2d1a50",
          950: "#1a1025",
        },
        "warm-sunset": {
          50: "#fff5ee",
          100: "#ffe8d6",
          200: "#ffcfab",
          300: "#ffb880",
          400: "#ff9f66",
          500: "#ff8040",
          600: "#e66b2a",
          700: "#bf5520",
          800: "#994418",
          900: "#73330f",
          950: "#4d220a",
        },
        orchid: {
          50: "#faf5fc",
          100: "#f3e8f8",
          200: "#e6d0f1",
          300: "#d4aee6",
          400: "#ba67d3",
          500: "#a44ec0",
          600: "#8a3ea3",
          700: "#713386",
          800: "#5c2a6d",
          900: "#4a2258",
          950: "#2e1238",
        },
        "golden-peach": {
          50: "#fffaf5",
          100: "#fff0e0",
          200: "#ffdfbf",
          300: "#ffca7b",
          400: "#ffb85c",
          500: "#ff9f66",
          600: "#e68040",
          700: "#bf6630",
          800: "#994d24",
          900: "#733a1a",
          950: "#4d2710",
        },
        "midnight-purple": {
          50: "#f4f0f8",
          100: "#e6ddf0",
          200: "#ccbbdf",
          300: "#b098cc",
          400: "#9475b8",
          500: "#7852a3",
          600: "#604285",
          700: "#4a336a",
          800: "#35254e",
          900: "#211733",
          950: "#110a1a",
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
