import React from "react";
import { Link } from "react-router";

function formatMs(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1000) return `${n} ms`;
  const seconds = Math.round(n / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

export default function AssignmentFlowToggle({
  value,
  loading,
  onChange,
  manualAssignHint = "",
  exceptionQueueTotal = 0,
  policy = null,
  exceptionsHref = "/superadmin/auto-assign/exceptions",
}) {
  const isAuto = value === true;
  const queueTotal = Number(exceptionQueueTotal) || 0;
  const maxAttempts = policy?.maxAttempts;
  const retryBase = formatMs(policy?.retryBaseMs);
  const overrideAfter = formatMs(policy?.manualOverrideMs);

  return (
    <div className="w-full rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-fg">Assignment Flow</div>
          <div className="mt-1 text-xs text-fg-muted">
            {isAuto
              ? "Auto-assign is on. Manual assign stays available when the per-order gate allows it (exception queue or override timeout)."
              : "Manual assignment is the default. Toggle on to enable automatic CAD assignment with a manual fallback."}
          </div>
          {manualAssignHint ? (
            <div className="mt-2 text-xs text-fg">{manualAssignHint}</div>
          ) : null}
          {isAuto && (maxAttempts != null || retryBase || overrideAfter) ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
              {maxAttempts != null ? <span>Max attempts: {maxAttempts}</span> : null}
              {retryBase ? <span>Retry base: {retryBase}</span> : null}
              {overrideAfter ? <span>Manual override after: {overrideAfter}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-fg-muted">
              {isAuto ? "Auto" : "Manual"}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => onChange?.(!isAuto)}
              className={[
                "relative inline-flex h-7 w-14 items-center rounded-full border transition",
                loading ? "opacity-60" : "opacity-100",
                isAuto
                  ? "border-[color-mix(in_srgb,var(--success)_35%,var(--border-color))] bg-success"
                  : "border-line bg-fg-muted/25",
              ].join(" ")}
              aria-label="Toggle assignment flow"
              aria-pressed={isAuto}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-surface shadow transition",
                  isAuto ? "translate-x-7" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>

          {exceptionsHref ? (
            <Link
              to={exceptionsHref}
              className="text-xs font-semibold text-[var(--cyan-accent)] hover:underline"
            >
              Exception queue{queueTotal > 0 ? ` (${queueTotal})` : ""}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
