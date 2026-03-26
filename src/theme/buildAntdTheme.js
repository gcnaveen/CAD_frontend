import { theme } from "antd";

const { defaultAlgorithm, darkAlgorithm } = theme;

/**
 * Ant Design v6 theme aligned with global CSS variables / dark class.
 * @param {boolean} isDark
 */
export function buildAntdTheme(isDark) {
  return {
    algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: "#0ea5e9",
      colorInfo: "#0ea5e9",
      colorLink: "#0284c7",
      borderRadius: 8,
      fontFamily:
        '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    components: {
      Message: {
        contentBg: "var(--bg-elevated)",
        colorText: "var(--text-primary)",
      },
      Notification: {
        colorBgElevated: "var(--bg-elevated)",
        colorText: "var(--text-primary)",
      },
      Modal: {
        contentBg: "var(--bg-elevated)",
        headerBg: "var(--bg-elevated)",
        titleColor: "var(--text-primary)",
        colorText: "var(--text-primary)",
        colorTextHeading: "var(--text-primary)",
      },
      Drawer: {
        colorBgElevated: "var(--bg-elevated)",
        colorText: "var(--text-primary)",
      },
      Popover: {
        colorBgElevated: "var(--bg-elevated)",
        colorText: "var(--text-primary)",
      },
      Card: {
        colorBgContainer: "var(--bg-primary)",
        colorBorderSecondary: "var(--border-color)",
      },
      Table: {
        colorBgContainer: "var(--bg-primary)",
        headerBg: "var(--bg-secondary)",
        headerColor: "var(--text-primary)",
        colorText: "var(--text-primary)",
        borderColor: "var(--border-color)",
        rowHoverBg: "var(--bg-hover)",
      },
      Input: {
        colorBgContainer: "var(--bg-primary)",
        colorText: "var(--text-primary)",
        colorBorder: "var(--border-color)",
        activeBorderColor: "var(--accent-color)",
        hoverBorderColor: "var(--accent-muted)",
      },
      Select: {
        colorBgContainer: "var(--bg-primary)",
        colorText: "var(--text-primary)",
        optionSelectedBg: "var(--bg-hover)",
        optionActiveBg: "var(--bg-hover)",
      },
      Form: {
        labelColor: "var(--text-secondary)",
      },
    },
  };
}
