import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--apple-blue)",
        success: "var(--apple-green)",
        danger: "var(--apple-red)",
        warning: "var(--apple-orange)",
      },
      fontFamily: {
        sans: ["SF Pro Text", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: ["SF Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        apple: "20px",
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
