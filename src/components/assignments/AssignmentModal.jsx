import React from "react";
import { formatUserDisplayLabel } from "../../services/assignmentApi.js";

function getModalTitle(mode) {
  return mode === "edit" ? "Update Assignment" : "Assign Sketch";
}

export default function AssignmentModal({
  open,
  mode, // "assign" | "edit"
  loading,
  sketch,
  statuses,
  cadUsers,
  initialValues,
  onClose,
  onSubmit,
  errorText,
}) {
  const [cadCenterId, setCadCenterId] = React.useState(initialValues?.cadCenterId ?? "");
  const [notes, setNotes] = React.useState(initialValues?.notes ?? "");
  const [status, setStatus] = React.useState(initialValues?.status ?? "");

  React.useEffect(() => {
    setCadCenterId(initialValues?.cadCenterId ?? "");
    setNotes(initialValues?.notes ?? "");
    setStatus(initialValues?.status ?? "");
  }, [initialValues, open]);

  if (!open) return null;

  const isEdit = mode === "edit";
  const sketchId = sketch?._id ?? sketch?.id ?? "";
  const uploadedBy =
    formatUserDisplayLabel(sketch?.uploadedBy) ||
    formatUserDisplayLabel(sketch?.surveyor) ||
    formatUserDisplayLabel(sketch?.user) ||
    "—";
  const applicationId = sketch?.applicationId;

  const submit = (e) => {
    e.preventDefault();
    const payload = isEdit
      ? {
          status: status || undefined,
          notes: notes || undefined,
        }
      : {
          surveyorSketchUploadId: sketchId,
          cadCenterId: cadCenterId || undefined,
          notes: notes || undefined,
        };
    onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--text-primary)_42%,transparent)]"
        aria-label="Close modal"
        onClick={() => onClose?.()}
      />

      <div className="theme-animate-surface relative w-full max-w-lg rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <div className="text-base font-semibold text-fg">{getModalTitle(mode)}</div>
            <div className="mt-1 text-xs text-fg-muted">
              {applicationId ? (
                <>
                  Application ID: <span className="font-semibold text-fg">{applicationId}</span>
                </>
              ) : (
                <>Uploaded by: <span className="font-semibold text-fg">{uploadedBy}</span></>
              )}
            </div>
            <div className="mt-1 text-xs text-fg-muted">
              SLA deadline is set by the server on CAD assignment (48h). Client due dates are not sent.
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg hover:bg-surface-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4">
          {errorText ? (
            <div className="mb-3 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] px-3 py-2 text-sm text-danger">
              {errorText}
            </div>
          ) : null}

          <div className="space-y-4">
            {!isEdit ? (
              <div>
                <label className="block text-sm font-medium text-fg">CAD User</label>
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                  value={cadCenterId}
                  onChange={(e) => setCadCenterId(e.target.value)}
                  required
                >
                  <option value="">Select CAD user</option>
                  {(cadUsers || []).map((u) => (
                    <option key={u?._id ?? u?.id} value={u?._id ?? u?.id}>
                      {formatUserDisplayLabel(u) || "CAD user"}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-fg">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="">Select status</option>
                  {(statuses || []).map((s) => (
                    <option key={String(s?.value ?? s)} value={String(s?.value ?? s)}>
                      {String(s?.label ?? s?.value ?? s)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-fg">Notes</label>
              <textarea
                className="mt-1 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--homepage-cta-bg)] px-4 py-2 text-sm font-semibold text-[var(--homepage-cta-fg)] hover:opacity-90 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving…" : isEdit ? "Update" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
