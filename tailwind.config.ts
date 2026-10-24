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
        pengu: {
          primary: "#FF6B1A",
          hover: "#E85B0D",
          light: "#FFF4ED",
          dark: "#D6520B",
          charcoal: "#202124",
          softgray: "#F3F4F6",
          darkbg: "#121316",
          darkcard: "#1E2024",
          darkborder: "#2C2F36",
        },
        zaao: {
          primary: "#FF6B1A",
          hover: "#E85B0D",
          light: "#FFF4ED",
          dark: "#D6520B",
          charcoal: "#202124",
          softgray: "#F3F4F6",
          darkbg: "#121316",
          darkcard: "#1E2024",
          darkborder: "#2C2F36",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bengali)", "system-ui", "sans-serif"],
        bengali: ["var(--font-bengali)", "'Noto Sans Bengali'", "sans-serif"],
      },
      borderRadius: {
        brand: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
