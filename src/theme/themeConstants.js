/** @typedef {'light' | 'dark'} ResolvedTheme */
/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

export const THEME_STORAGE_KEY = "cad-theme-preference";

/** Values stored in localStorage; `system` follows OS and updates live. */
export const THEME_PREFERENCE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};
