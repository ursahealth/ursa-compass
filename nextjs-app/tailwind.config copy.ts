import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        "13": "repeat(13, minmax(0, 1fr))",
      },
      colors: {
        green: {
          forest: "#203600",
          pine: "#487000",
          ursa: "#71BF00",
        },
        blue: {
          storm: "#003057",
          400: "#2589FE",
          500: "#0070F3",
          600: "#2F6FEB",
        },
      },
    },
    keyframes: {
      shimmer: {
        "100%": {
          transform: "translateX(100%)",
        },
      },
      ellipsis: {
        "0%": { width: "0%" },
        "25%": { width: "33%" },
        "50%": { width: "66%" },
        "75%": { width: "100%" },
      },
    },
    animation: {
      ellipsis: "ellipsis 1.5s infinite steps(1)",
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
