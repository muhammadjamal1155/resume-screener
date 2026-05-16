/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0B0D",
        surface:    "#111318",
        border:     "#1E2128",
        muted:      "#6B7280",
        accent:     "#4F6EF7",
        "accent-hover": "#3A56E0",
        success:    "#22C55E",
        warning:    "#F59E0B",
        danger:     "#EF4444",
        foreground: "#F3F4F6",
        subtle:     "#9CA3AF",
        card:       "#12151B",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
        accent: "0 0 20px rgba(79,110,247,0.18)",
        "accent-md": "0 0 32px rgba(79,110,247,0.25)",
        glow: "0 0 0 rgba(0,0,0,0)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progressFill: {
          "0%":   { width: "0%" },
          "100%": { width: "var(--target-width)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "fade-in": "fadeIn 0.3s ease forwards",
      },
    },
  },
  plugins: [],
};
