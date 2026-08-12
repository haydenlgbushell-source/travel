import type { Config } from "tailwindcss";

/**
 * Design tokens ported from the `bali-2025-itinerary-v2` mockup.
 * The "ticket stub / kraft paper" system: everything in the app should be
 * expressible with these tokens — avoid one-off hex values in components.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12332E", // hero bg / nav bg
          soft: "#1B453E",
          text: "#20241F", // body text
        },
        paper: {
          DEFAULT: "#F3E9D2", // app background (kraft/ticket paper)
          hi: "#FAF4E6", // card background
        },
        lagoon: {
          DEFAULT: "#1C7C8C", // primary accent
          dark: "#125866", // primary buttons / active states
        },
        papaya: "#FF7A45", // secondary accent
        stamp: "#C2452D", // alerts / urgent
        palm: "#3F7D58", // success / confirmed
        muted: "#6B6459", // secondary text
        line: "#DCCFAF", // borders / dashed dividers
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "16px",
        phone: "22px",
        pill: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 51, 46, 0.06), 0 8px 24px -12px rgba(18, 51, 46, 0.18)",
        nav: "0 -8px 24px -12px rgba(18, 51, 46, 0.35)",
        phone: "0 24px 64px -24px rgba(18, 51, 46, 0.45)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
