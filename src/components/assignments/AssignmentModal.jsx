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
  const [dueDate, setDueDate] = React.useState(initialValues?.dueDate ?? "");
  const [notes, setNotes] = React.useState(initialValues?.notes ?? "");
  const [status, setStatus] = React.useState(initialValues?.status ?? "");

  React.useEffect(() => {
    setCadCenterId(initialValues?.cadCenterId ?? "");
    setDueDate(initialValues?.dueDate ?? "");
    setNotes(initialValues?.notes ?? "");
    setStatus(initialValues?.status ?? "");
  }, [initialValues, open]);

  if (!open) return null;

  const isEdit = mode === "edit";
  const sketchId = sketch?._id ?? sketch?.id ?? "";

  const submit = (e) => {
    e.preventDefault();
    const payload = isEdit
      ? {
          status: status || undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }
      : {
          surveyorSketchUploadId: sketchId,
          cadCenterId: cadCenterId || undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        };
    onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close modal"
        onClick={() => onClose?.()}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-slate-900">{getModalTitle(mode)}</div>
            <div className="mt-1 text-xs text-slate-500">
              Sketch: <span className="font-mono">{String(sketchId || "-")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4">
          {errorText ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorText}
            </div>
          ) : null}

          <div className="space-y-4">
            {!isEdit ? (
              <div>
                <label className="block text-sm font-medium text-slate-700">CAD User</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={cadCenterId}
                  onChange={(e) => setCadCenterId(e.target.value)}
                  required
                >
                  <option value="">Select CAD user</option>
                  {(cadUsers || []).map((u) => (
                    <option key={u?._id ?? u?.id} value={u?._id ?? u?.id}>
                      {formatUserDisplayLabel(u) || String(u?._id ?? u?.id ?? "")}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
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
              <label className="block text-sm font-medium text-slate-700">Due Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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

