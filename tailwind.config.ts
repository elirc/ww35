import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fb",
          100: "#eef1f7",
          200: "#d9e0ef",
          300: "#b7c3dd",
          400: "#8f9fbe",
          500: "#65739a",
          600: "#4e5777",
          700: "#3f475f",
          800: "#2c3347",
          900: "#181d2d"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
