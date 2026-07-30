import React from "react";
import { Rate } from "antd";
import {
  formatUserDisplayLabel,
  resolveAssignmentIdFromEntity,
} from "../../services/assignmentApi.js";
import {
  canViewAssignmentFeedback,
  extractFeedbackFromEntity,
} from "../../utils/assignmentFeedbackUtils.js";
import {
  canonicalizeSketchStatus,
  getSketchStatusLabel,
} from "../../utils/lifecycleQc.js";
import { resolveManualAssignUi } from "../../utils/autoAssignManualGate.js";
import SlaStatus from "../sla/SlaStatus.jsx";
import { getSlaRiskTone, resolveSla } from "../../utils/sla.js";

function getStatusBadgeClasses(status) {
  const s = canonicalizeSketchStatus(status);
  switch (s) {
    case "PAYMENT_PENDING":
      return "bg-[color-mix(in_srgb,var(--warning)_14%,var(--bg-secondary))] text-[var(--warning)] ring-[color-mix(in_srgb,var(--warning)_35%,var(--border-color))]";
    case "PENDING":
      return "bg-surface-2 text-fg ring-line";
    case "ASSIGNED":
      return "bg-[color-mix(in_srgb,var(--cyan-accent)_14%,var(--bg-secondary))] text-[var(--cyan-accent)] ring-[color-mix(in_srgb,var(--cyan-accent)_40%,var(--border-color))]";
    case "CAD_DELIVERED":
      return "bg-[color-mix(in_srgb,var(--cyan-accent)_10%,var(--bg-secondary))] text-[var(--cyan-accent)] ring-[color-mix(in_srgb,var(--cyan-accent)_30%,var(--border-color))]";
    case "UNDER_REVISION":
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

function slaRowBg(sla) {
  const tone = getSlaRiskTone(sla?.state);
  if (tone === "breached") {
    return "bg-[color-mix(in_srgb,var(--danger)_08%,transparent)]";
  }
  if (tone === "escalated") {
    return "bg-[color-mix(in_srgb,#fa8c16_10%,transparent)]";
  }
  if (tone === "warning") {
    return "bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]";
  }
  return "";
}

export default function SketchTable({
  rows,
  loading,
  errorText = "",
  onRetry,
  autoAssignEnabled,
  manualGates = {},
  gatesLoading = false,
  onAssignClick,
  onEditClick,
  onFeedbackClick,
  onExtendSlaClick,
}) {
  const colCount = 7 + (onFeedbackClick ? 1 : 0);

  return (
    <div className="theme-animate-surface w-full overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="px-4 py-3">Application ID</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Assigned CAD User</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
              {onFeedbackClick ? <th className="px-4 py-3 text-right">Feedback</th> : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-fg-muted" colSpan={colCount}>
                  Loading…
                </td>
              </tr>
            ) : errorText ? (
              <tr>
                <td className="px-4 py-6" colSpan={colCount}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-danger">{errorText}</div>
                    {typeof onRetry === "function" ? (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : rows?.length ? (
              rows.map((row, index) => {
                const status = row?.status;
                const stUp = canonicalizeSketchStatus(status);
                const isPending = stUp === "PENDING";
                const uploadId = row?._id ?? row?.id;
                const gateKey = uploadId != null ? String(uploadId) : null;
                const gate = gateKey ? manualGates[gateKey] : null;
                const assignUi = isPending
                  ? resolveManualAssignUi(
                      gatesLoading && !gate
                        ? null
                        : gate || {
                            allowed: true,
                            reason: "AUTO_ASSIGN_OFF",
                          }
                    )
                  : { showAssign: false, disabled: false, badge: null, hint: null };
                const canEdit = ["ASSIGNED", "UNDER_REVISION"].includes(stUp);
                const rowFeedback = extractFeedbackFromEntity(row);
                const canFeedback = Boolean(onFeedbackClick) && canViewAssignmentFeedback(row);
                const sla = resolveSla(row);
                const assignmentId = resolveAssignmentIdFromEntity(row);
                const canExtend =
                  Boolean(onExtendSlaClick) && Boolean(assignmentId) && !isPending;

                const assignedUserName =
                  row?.assignedCadUserLabel ||
                  formatUserDisplayLabel(row?.assignedCadUser) ||
                  formatUserDisplayLabel(row?.assignment?.cadUser) ||
                  formatUserDisplayLabel(row?.assignment?.assignedTo) ||
                  formatUserDisplayLabel(row?.assignment?.cadCenterId) ||
                  formatUserDisplayLabel(row?.cadCenterId) ||
                  formatUserDisplayLabel(row?.cadCenter) ||
                  formatUserDisplayLabel(row?.assignment?.cadCenter) ||
                  "—";

                const uploadedBy =
                  formatUserDisplayLabel(row?.uploadedBy) ||
                  formatUserDisplayLabel(row?.surveyor) ||
                  formatUserDisplayLabel(row?.user) ||
                  (typeof row?.uploadedBy === "string" ? row.uploadedBy : "") ||
                  "-";

                const id = uploadId ?? `row-${index}`;
                const applicationId = row?.applicationId || "—";

                return (
                  <tr
                    key={String(id)}
                    className={["hover:bg-surface-2/60", slaRowBg(sla)].filter(Boolean).join(" ")}
                  >
                    <td className="px-4 py-3 text-fg">{applicationId}</td>
                    <td className="px-4 py-3 text-fg">{uploadedBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                            getStatusBadgeClasses(status),
                          ].join(" ")}
                        >
                          {getSketchStatusLabel(status) || String(status || "-")}
                        </span>
                        {assignUi.badge ? (
                          <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,var(--bg-secondary))] px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--warning)_35%,var(--border-color))]">
                            {assignUi.badge}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg">
                      <SlaStatus sla={sla} compact />
                    </td>
                    <td className="px-4 py-3 text-fg">{assignedUserName}</td>
                    <td className="px-4 py-3 text-fg">
                      {fmtDate(row?.createdAt ?? row?.createdDate ?? row?.uploadedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex justify-end gap-2">
                          {assignUi.showAssign ? (
                            <button
                              type="button"
                              disabled={assignUi.disabled}
                              title={assignUi.hint || undefined}
                              onClick={() => onAssignClick?.(row)}
                              className="rounded-lg bg-[var(--homepage-cta-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--homepage-cta-fg)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

                          {canExtend ? (
                            <button
                              type="button"
                              onClick={() => onExtendSlaClick?.(row)}
                              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-2"
                            >
                              Extend SLA
                            </button>
                          ) : null}
                        </div>
                        {assignUi.hint ? (
                          <span className="max-w-[14rem] text-right text-[10px] leading-snug text-fg-muted">
                            {assignUi.hint}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {onFeedbackClick ? (
                      <td className="px-4 py-3 text-right">
                        {canFeedback ? (
                          <div className="flex flex-col items-end gap-1">
                            {rowFeedback?.rating != null ? (
                              <div className="flex items-center gap-1">
                                <Rate
                                  disabled
                                  allowHalf
                                  value={Number(rowFeedback.rating) || 0}
                                  className="text-xs"
                                  style={{ fontSize: 12 }}
                                />
                                <span className="text-xs font-semibold text-fg">
                                  {rowFeedback.rating}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-fg-muted">Not submitted</span>
                            )}
                            <button
                              type="button"
                              onClick={() => onFeedbackClick(row)}
                              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-2"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-fg-muted">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-fg-muted" colSpan={colCount}>
                  No sketches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {autoAssignEnabled === true ? (
        <div className="border-t border-line bg-surface-2 px-4 py-3 text-sm text-fg">
          Auto-assign is enabled. Manual Assign appears when the order gate allows it
          (exception queue or override timeout), and stays disabled while auto-assign is active.
        </div>
      ) : null}
    </div>
  );
}
