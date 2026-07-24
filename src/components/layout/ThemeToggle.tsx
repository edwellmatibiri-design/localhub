"use client";

import { useTheme } from "@/app/theme/useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="border-lh-border bg-lh-surface-soft text-lh-text-secondary hover:bg-lh-surface rounded-full border px-3 py-1 text-xs transition"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
