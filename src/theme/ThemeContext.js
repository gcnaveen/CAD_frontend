import { createContext } from "react";

/**
 * @typedef {'light' | 'dark'} ResolvedTheme
 * @typedef {'light' | 'dark' | 'system'} ThemePreference
 * @typedef {{ resolvedTheme: ResolvedTheme, preference: ThemePreference, setPreference: (p: ThemePreference) => void, toggleTheme: () => void }} ThemeContextValue
 */

/** @type {import('react').Context<ThemeContextValue | null>} */
export const ThemeContext = createContext(null);
