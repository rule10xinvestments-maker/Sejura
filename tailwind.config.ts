import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        moss: "#305b45",
        leaf: "#4f8a63",
        clay: "#b85c38",
        mist: "#eef4f0",
        line: "#d8e2dc"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
