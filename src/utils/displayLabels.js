/**
 * COPY-03 — turn API enums / SCREAMING_SNAKE into user-facing labels.
 * Prefer domain helpers (getSketchStatusLabel) when the value is a sketch lifecycle status.
 */

const KNOWN_LABELS = Object.freeze({
  PENDING_RETRY: "Pending retry",
  EXCEPTION: "Exception",
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  FAILED: "Failed",
  SUCCESS: "Success",
  CREATED: "Created",
  INITIATED: "Initiated",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  REQUIRES_PAYMENT: "Requires payment",
  UNPAID: "Unpaid",
});

/**
 * @param {unknown} value
 * @returns {string}
 */
export function humanizeEnumLabel(value) {
  if (value == null || value === "") return "—";
  const raw = String(value).trim();
  if (!raw || raw === "—") return "—";
  const key = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Auto-assign exception queue statuses.
 * @param {unknown} status
 */
export function getAutoAssignExceptionStatusLabel(status) {
  return humanizeEnumLabel(status);
}

/**
 * CAD wallet / payout settlement status.
 * @param {unknown} status
 */
export function getPayoutStatusLabel(status) {
  return humanizeEnumLabel(status);
}
