import React from "react";
import { formatUserDisplayLabel } from "../../services/assignmentApi.js";

function getStatusBadgeClasses(status) {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "PENDING":
      return "bg-surface-2 text-fg ring-line";
    case "ASSIGNED":
      return "bg-[color-mix(in_srgb,var(--cyan-accent)_14%,var(--bg-secondary))] text-[var(--cyan-accent)] ring-[color-mix(in_srgb,var(--cyan-accent)_40%,var(--border-color))]";
    case "UNDER_REVIEW":
      return "bg-[color-mix(in_srgb,var(--warning)_18%,var(--bg-secondary))] text-[color-mix(in_srgb,var(--warning)_85%,var(--text-primary))] ring-[color-mix(in_srgb,var(--warning)_35%,var(--border-color))]";
    case "APPROVED":
      return "bg-[color-mix(in_srgb,var(--success)_14%,var(--bg-secondary))] text-success ring-[color-mix(in_srgb,var(--success)_35%,var(--border-color))]";
    case "REJECTED":
      return "bg-[color-mix(in_srgb,var(--danger)_12%,var(--bg-secondary))] text-danger ring-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))]";
    default:
      return "bg-surface-2 text-fg ring-line";
  }
}

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function SketchTable({
  rows,
  loading,
  autoAssignEnabled,
  onAssignClick,
  onEditClick,
}) {
  return (
    <div className="theme-animate-surface w-full overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="px-4 py-3">Sketch ID</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned CAD User</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-fg-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows?.length ? (
              rows.map((row) => {
                const status = row?.status;
                const isPending = String(status || "").toUpperCase() === "PENDING";
                const canAssign = isPending && autoAssignEnabled === false;
                const canEdit = ["ASSIGNED", "UNDER_REVIEW"].includes(
                  String(status || "").toUpperCase()
                );

                const assignedUserName =
                  formatUserDisplayLabel(row?.assignedCadUser) ||
                  formatUserDisplayLabel(row?.assignment?.cadUser) ||
                  formatUserDisplayLabel(row?.assignment?.cadCenterId) ||
                  formatUserDisplayLabel(row?.cadCenterId) ||
                  formatUserDisplayLabel(row?.cadCenter) ||
                  formatUserDisplayLabel(row?.assignment?.cadCenter) ||
                  "-";

                const uploadedBy =
                  formatUserDisplayLabel(row?.uploadedBy) ||
                  formatUserDisplayLabel(row?.surveyor) ||
                  formatUserDisplayLabel(row?.user) ||
                  (typeof row?.uploadedBy === "string" ? row.uploadedBy : "") ||
                  "-";

                const id = row?._id ?? row?.id ?? "-";

                return (
                  <tr key={String(id)} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-mono text-xs text-fg">
                      {String(id)}
                    </td>
                    <td className="px-4 py-3 text-fg">{uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                          getStatusBadgeClasses(status),
                        ].join(" ")}
                      >
                        {String(status || "-")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg">{assignedUserName}</td>
                    <td className="px-4 py-3 text-fg">
                      {fmtDate(row?.createdAt ?? row?.createdDate ?? row?.uploadedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canAssign ? (
                          <button
                            type="button"
                            onClick={() => onAssignClick?.(row)}
                            className="rounded-lg bg-[var(--homepage-cta-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--homepage-cta-fg)] hover:opacity-90"
                          >
                            Assign
                          </button>
                        ) : null}

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => onEditClick?.(row)}
                            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-2"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-fg-muted" colSpan={6}>
                  No sketches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {autoAssignEnabled === true ? (
        <div className="border-t border-line bg-surface-2 px-4 py-3 text-sm text-fg">
          Auto assignment enabled. Manual assignment disabled.
        </div>
      ) : null}
    </div>
  );
}

