import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        panel: "#f7f8fb",
        line: "#dbe1ea",
        brand: {
          50: "#eef7f4",
          100: "#d5ece4",
          500: "#2f8f75",
          600: "#24715f",
          700: "#1f5c50"
        },
        amber: {
          500: "#c47a1c"
        }
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
