import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F6EEE0",
        champagne: "#EDE1C6",
        maroon: {
          DEFAULT: "#895129",
          deep: "#693E1F",
        },
        gold: {
          DEFAULT: "#B4913F",
          light: "#D9BE7C",
          soft: "#C9A961",
        },
        ink: "#3A2A1E",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      fontSize: {
        // ── Admin dashboard suitable type scale (compact, Poppins-based) ──
        "admin-micro": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.04em" }], // 11px — hints, timestamps
        "admin-small": ["0.75rem", { lineHeight: "1.125rem" }], // 12px — body small, buttons
        "admin-body": ["0.8125rem", { lineHeight: "1.375rem" }], // 13px — table cells, inputs
        "admin-title": ["1.25rem", { lineHeight: "1.6rem", letterSpacing: "0.02em" }], // 20px — page title (mobile)
        "admin-title-lg": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "0.02em" }], // 22px — page title (desktop)
        "admin-kpi": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }], // 22px — KPI numbers
        "admin-modal": ["1rem", { lineHeight: "1.5rem" }], // 16px — modal title
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        shimmer: "shimmer 8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
