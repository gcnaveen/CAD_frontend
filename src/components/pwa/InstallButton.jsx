import { Button, App } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useInstallPrompt } from "../../hooks/useInstallPrompt.js";

/**
 * Shows only when the browser exposes a PWA install prompt (`beforeinstallprompt`).
 * Must render under Ant Design `<App>` (see `main.jsx`) so toast works.
 */
export default function InstallButton({
  type = "default",
  size = "middle",
  children = "Install app",
  className,
  style,
  showLabel = true,
}) {
  const { message } = App.useApp();
  const { installable, installApp } = useInstallPrompt({
    onInstalled: () => {
      message.success("App installed");
    },
    onUserChoice: (outcome) => {
      if (import.meta.env.DEV) {
        console.info("[PWA] Install prompt outcome:", outcome);
      }
    },
  });

  if (!installable) {
    return null;
  }

  return (
    <Button
      type={type}
      size={size}
      icon={<DownloadOutlined />}
      onClick={() => void installApp()}
      className={className}
      style={style}
      aria-label={typeof children === "string" ? children : "Install app"}
    >
      {showLabel ? children : null}
    </Button>
  );
}
