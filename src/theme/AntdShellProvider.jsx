import { useMemo } from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import { useTheme } from "./useTheme.js";
import { buildAntdTheme } from "./buildAntdTheme.js";
import "./antd-shell.css";

/**
 * Ant Design shell for authenticated / form-heavy surfaces (M-05).
 * Loaded only via ProtectedRoute (lazy), so homepage stays free of antd.
 * Sync imports here guarantee AntdApp exists before children (e.g. NotificationBell
 * calling App.useApp()) mount — async loading previously caused a white screen.
 */
export default function AntdShellProvider({ children }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const antdConfig = useMemo(() => buildAntdTheme(isDark), [isDark]);

  return (
    <ConfigProvider theme={antdConfig}>
      <AntdApp
        className="app-antd-root"
        message={{ className: "app-antd-message" }}
        notification={{ className: "app-antd-notification" }}
      >
        {children}
      </AntdApp>
    </ConfigProvider>
  );
}
