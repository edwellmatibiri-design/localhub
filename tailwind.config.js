module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        lh: {
          bg: "var(--lh-bg)",
          surface: "var(--lh-surface)",
          "surface-soft": "var(--lh-surface-soft)",
          border: "var(--lh-border)",
          accent: "var(--lh-accent)",
          "accent-soft": "var(--lh-accent-soft)",
          "accent-muted": "var(--lh-accent-muted)",
          "text-primary": "var(--lh-text-primary)",
          "text-secondary": "var(--lh-text-secondary)",
          "on-accent": "var(--lh-on-accent)",
          muted: "var(--lh-text-secondary)",
          emerald: "var(--lh-success)",
          amber: "var(--lh-warning)",
          danger: "var(--lh-danger)",
          success: "var(--lh-success)",
          warning: "var(--lh-warning)",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        "lh-soft": "0 18px 40px rgba(15, 23, 42, 0.45)",
        "lh-inner": "inset 0 0 0 1px rgba(148, 163, 184, 0.15)",
      },
      fontFamily: {
        sans: ["system-ui", "SF Pro Text", "Inter", "sans-serif"],
      },
    },
  },
};
