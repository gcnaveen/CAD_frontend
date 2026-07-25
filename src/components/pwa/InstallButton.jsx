import { useInstallPrompt } from "../../hooks/useInstallPrompt.js";

/**
 * Native install CTA — avoids pulling Ant Design onto public pages (M-05).
 */
export default function InstallButton({
  children = "Install app",
  className,
  style,
  showLabel = true,
}) {
  const { installable, installApp } = useInstallPrompt({
    onInstalled: () => {
      /* no antd toast on public shell */
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
    <button
      type="button"
      onClick={() => void installApp()}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 8,
        border: "1px solid currentColor",
        background: "transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        ...style,
      }}
      aria-label={typeof children === "string" ? children : "Install app"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel ? children : null}
    </button>
  );
}
