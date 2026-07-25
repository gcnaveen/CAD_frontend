import React, { useEffect, useState } from "react";
import { fetchReleaseVersion } from "../services/versionService.js";

/** Show only in Vite DEV or when explicitly enabled for admin/ops builds. */
// Exported for unit tests / layout gates (not a component).
// eslint-disable-next-line react-refresh/only-export-components -- intentional named helper export
export function shouldShowBuildProvenanceFooter() {
  return (
    Boolean(import.meta.env.DEV) ||
    String(import.meta.env.VITE_SHOW_BUILD_FOOTER || "").toLowerCase() === "true"
  );
}

function shortSha(sha) {
  if (!sha || typeof sha !== "string") return null;
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

function formatDeployedAt(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

/**
 * Small H-05 release provenance strip for admin / dev builds.
 * Calls GET /api/version; renders nothing if disabled or fetch fails.
 */
export default function BuildProvenanceFooter() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!shouldShowBuildProvenanceFooter()) return undefined;
    let cancelled = false;
    fetchReleaseVersion().then((data) => {
      if (!cancelled && data && typeof data === "object") setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!shouldShowBuildProvenanceFooter() || !info) return null;

  const sha = shortSha(info.gitSha);
  const lock = info.lockHash
    ? String(info.lockHash).length > 12
      ? `${String(info.lockHash).slice(0, 12)}…`
      : String(info.lockHash)
    : null;
  const deployed = formatDeployedAt(info.deployedAt);

  const parts = [
    sha ? `sha ${sha}` : null,
    info.stage ? `stage ${info.stage}` : null,
    info.migrationVersion != null && info.migrationVersion !== ""
      ? `mig ${info.migrationVersion}`
      : null,
    lock ? `lock ${lock}` : null,
    deployed ? `at ${deployed}` : null,
  ].filter(Boolean);

  if (!parts.length) return null;

  return (
    <div
      role="contentinfo"
      aria-label="Build provenance"
      title={[
        info.gitSha ? `gitSha: ${info.gitSha}` : null,
        info.lockHash ? `lockHash: ${info.lockHash}` : null,
        info.stage ? `stage: ${info.stage}` : null,
        info.migrationVersion != null
          ? `migrationVersion: ${info.migrationVersion}`
          : null,
        info.deployedAt ? `deployedAt: ${info.deployedAt}` : null,
      ]
        .filter(Boolean)
        .join("\n")}
      style={{
        marginTop: 8,
        padding: "6px 12px",
        fontSize: 11,
        lineHeight: 1.4,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        color: "var(--text-secondary, rgba(0,0,0,0.45))",
        textAlign: "center",
        letterSpacing: "0.02em",
        userSelect: "text",
        wordBreak: "break-all",
      }}
    >
      build · {parts.join(" · ")}
    </div>
  );
}
