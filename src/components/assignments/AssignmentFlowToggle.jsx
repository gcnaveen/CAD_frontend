import React from "react";

export default function AssignmentFlowToggle({ value, loading, onChange }) {
  const isAuto = value === true;

  return (
    <div className="w-full rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-fg">Assignment Flow</div>
          <div className="mt-1 text-xs text-fg-muted">
            Auto assignment disables manual assignments.
          </div>
        </div>

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
      </div>
    </div>
  );
}

