import { useEffect, useMemo, useState } from "react";
import { useTheme } from "./useTheme.js";

/**
 * Loads Ant Design ConfigProvider only for authenticated / form-heavy surfaces (M-05).
 */
export default function AntdShellProvider({ children }) {
  const { resolvedTheme } = useTheme();
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("antd"), import("./buildAntdTheme.js")]).then(
      ([antd, themeMod]) => {
        if (cancelled) return;
        setBundle({
          ConfigProvider: antd.ConfigProvider,
          AntdApp: antd.App,
          buildAntdTheme: themeMod.buildAntdTheme,
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark = resolvedTheme === "dark";
  const antdConfig = useMemo(
    () => (bundle ? bundle.buildAntdTheme(isDark) : null),
    [bundle, isDark],
  );

  if (!bundle || !antdConfig) {
    return children;
  }

  const { ConfigProvider, AntdApp } = bundle;
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
