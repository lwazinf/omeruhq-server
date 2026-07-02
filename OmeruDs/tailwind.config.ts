import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // WhatsApp dark palette
        wa: {
          bg: "#0b141a",
          panel: "#111b21",
          header: "#202c33",
          search: "#202c33",
          incoming: "#202c33",
          outgoing: "#005c4b",
          bubbleMeta: "#8696a0",
          tick: "#53bdeb",
          link: "#53bdeb",
          green: "#00a884",
          greenDark: "#008069",
          divider: "rgba(233,237,239,0.08)",
          textPrimary: "#e9edef",
          textSecondary: "#8696a0",
        },
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "Helvetica Neue",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        bubble: "0 1px 0.5px rgba(11,20,26,0.13)",
        sheet: "0 -8px 30px rgba(0,0,0,0.5)",
      },
      keyframes: {
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "typing-1": "typing 1.2s infinite",
        "typing-2": "typing 1.2s infinite 0.2s",
        "typing-3": "typing 1.2s infinite 0.4s",
      },
    },
  },
  plugins: [],
};

export default config;
