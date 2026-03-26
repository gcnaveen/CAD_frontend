import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/useTheme.js";

const baseBtn =
  "inline-flex items-center justify-center rounded-xl border transition-[background-color,color,border-color,box-shadow] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]";

/**
 * Theme toggle: switches between explicit light and dark (persists to localStorage).
 * @param {{ variant?: 'default' | 'compact', className?: string }} props
 */
export default function ThemeToggle({ variant = "default", className = "" }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const isCompact = variant === "compact";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`${baseBtn} border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-sm ${isCompact ? "h-9 w-9" : "h-10 w-10 px-2"} ${className}`.trim()}
    >
      {dark ? <Sun size={isCompact ? 18 : 20} strokeWidth={2} /> : <Moon size={isCompact ? 18 : 20} strokeWidth={2} />}
    </button>
  );
}
