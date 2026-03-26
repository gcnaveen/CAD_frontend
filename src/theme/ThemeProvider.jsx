import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";
import { App as AntdApp } from "antd";
import { ThemeContext } from "./ThemeContext.js";
import { THEME_STORAGE_KEY, THEME_PREFERENCE } from "./themeConstants.js";
import { buildAntdTheme } from "./buildAntdTheme.js";

function readStoredPreference() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      raw === THEME_PREFERENCE.LIGHT ||
      raw === THEME_PREFERENCE.DARK ||
      raw === THEME_PREFERENCE.SYSTEM
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return THEME_PREFERENCE.SYSTEM;
}

function getSystemDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** @param {import('./themeConstants.js').ThemePreference} pref */
function resolveFromPreference(pref) {
  if (pref === THEME_PREFERENCE.DARK) return "dark";
  if (pref === THEME_PREFERENCE.LIGHT) return "light";
  return getSystemDark() ? "dark" : "light";
}

/** @param {import('./themeConstants.js').ResolvedTheme} resolved */
function applyDomTheme(resolved) {
  const root = document.documentElement;
  const dark = resolved === "dark";
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(() =>
    typeof window !== "undefined" ? readStoredPreference() : THEME_PREFERENCE.SYSTEM,
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    typeof window !== "undefined"
      ? resolveFromPreference(readStoredPreference())
      : "light",
  );

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const resolved = resolveFromPreference(next);
    setResolvedTheme(resolved);
    applyDomTheme(resolved);
  }, []);

  useEffect(() => {
    applyDomTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (preference !== THEME_PREFERENCE.SYSTEM) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyDomTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    const nextResolved = resolvedTheme === "dark" ? "light" : "dark";
    setPreference(
      nextResolved === "dark" ? THEME_PREFERENCE.DARK : THEME_PREFERENCE.LIGHT,
    );
  }, [resolvedTheme, setPreference]);

  const ctx = useMemo(
    () => ({
      resolvedTheme,
      preference,
      setPreference,
      toggleTheme,
    }),
    [resolvedTheme, preference, setPreference, toggleTheme],
  );

  const isDark = resolvedTheme === "dark";
  const antdConfig = useMemo(() => buildAntdTheme(isDark), [isDark]);

  return (
    <ThemeContext.Provider value={ctx}>
      <ConfigProvider theme={antdConfig}>
        <AntdApp
          className="app-antd-root"
          message={{ className: "app-antd-message" }}
          notification={{ className: "app-antd-notification" }}
        >
          {children}
        </AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
