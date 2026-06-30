export const SURVEYOR_ORDER_STATUS_LABELS = {
  PAYMENT_PENDING: "Payment Pending",
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  CAD_DELIVERED: "CAD Delivered",
  UNDER_REVIEW: "Under Review",
  UNDER_REVISION: "Under Revision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const SURVEYOR_ORDER_STATUS_STYLES = {
  "Payment Pending":
    "border-line bg-[color-mix(in_srgb,var(--warning)_14%,var(--bg-secondary))] text-[var(--warning)]",
  Pending:
    "border-line bg-[color-mix(in_srgb,var(--user-accent)_14%,var(--bg-secondary))] text-[var(--user-accent)]",
  Assigned:
    "border-line bg-[color-mix(in_srgb,var(--cyan-accent)_12%,var(--bg-secondary))] text-[var(--cyan-accent)]",
  "CAD Delivered":
    "border-line bg-[color-mix(in_srgb,var(--violet-accent)_12%,var(--bg-secondary))] text-[var(--violet-accent)]",
  "Under Review":
    "border-line bg-[color-mix(in_srgb,var(--accent-color)_12%,var(--bg-secondary))] text-accent",
  "Under Revision":
    "border-line bg-[color-mix(in_srgb,var(--warning)_12%,var(--bg-secondary))] text-[var(--warning)]",
  Approved:
    "border-line bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] text-success",
  Rejected:
    "border-line bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg-secondary))] text-danger",
};

/**
 * Status bucket rules for GET /api/surveyor/orders
 * - active: PAYMENT_PENDING, PENDING, ASSIGNED, CAD_DELIVERED, UNDER_REVISION
 * - completed: APPROVED
 * - cancelled: REJECTED
 */
const ACTIVE_STATUSES = new Set([
  "PAYMENT_PENDING",
  "PENDING",
  "ASSIGNED",
  "CAD_DELIVERED",
  "UNDER_REVISION",
]);

const COMPLETED_STATUSES = new Set(["APPROVED"]);
const CANCELLED_STATUSES = new Set(["REJECTED"]);

export function getSurveyorOrderStatusLabel(apiStatus) {
  return SURVEYOR_ORDER_STATUS_LABELS[apiStatus] || apiStatus || "Pending";
}

/** Returns tab bucket per API, or null when the status only appears under "all". */
export function getSurveyorOrderBucket(apiStatus) {
  if (COMPLETED_STATUSES.has(apiStatus)) return "completed";
  if (CANCELLED_STATUSES.has(apiStatus)) return "cancelled";
  if (ACTIVE_STATUSES.has(apiStatus)) return "active";
  return null;
}

export function matchesSurveyorOrderBucket(apiStatus, tab) {
  if (!tab || tab === "all") return true;
  return getSurveyorOrderBucket(apiStatus) === tab;
}
