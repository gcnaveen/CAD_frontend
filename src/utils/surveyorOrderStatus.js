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
 * Status bucket rules for surveyor dashboard / requests tabs.
 * - active: PAYMENT_PENDING, PENDING, ASSIGNED, UNDER_REVISION
 * - completed: CAD_DELIVERED, APPROVED
 * - cancelled: REJECTED
 */
export const SURVEYOR_ACTIVE_STATUSES = [
  "PAYMENT_PENDING",
  "PENDING",
  "ASSIGNED",
  "UNDER_REVISION",
];
export const SURVEYOR_COMPLETED_STATUSES = ["CAD_DELIVERED", "APPROVED"];
export const SURVEYOR_CANCELLED_STATUSES = ["REJECTED"];

const ACTIVE_STATUSES = new Set(SURVEYOR_ACTIVE_STATUSES);
const COMPLETED_STATUSES = new Set(SURVEYOR_COMPLETED_STATUSES);
const CANCELLED_STATUSES = new Set(SURVEYOR_CANCELLED_STATUSES);

/** Comma-separated status query for GET /api/surveyor/orders (overrides bucket). */
export function getSurveyorOrderStatusQuery(tab) {
  if (tab === "active") return SURVEYOR_ACTIVE_STATUSES.join(",");
  if (tab === "completed") return SURVEYOR_COMPLETED_STATUSES.join(",");
  if (tab === "cancelled") return SURVEYOR_CANCELLED_STATUSES.join(",");
  return null;
}

export function getSurveyorOrderStatusLabel(apiStatus) {
  return SURVEYOR_ORDER_STATUS_LABELS[apiStatus] || apiStatus || "Pending";
}

/** Returns tab bucket, or null when the status only appears under "all". */
export function getSurveyorOrderBucket(apiStatus) {
  const status = apiStatus === "UNDER_REVIEW" ? "UNDER_REVISION" : apiStatus;
  if (COMPLETED_STATUSES.has(status)) return "completed";
  if (CANCELLED_STATUSES.has(status)) return "cancelled";
  if (ACTIVE_STATUSES.has(status)) return "active";
  return null;
}

export function matchesSurveyorOrderBucket(apiStatus, tab) {
  if (!tab || tab === "all") return true;
  return getSurveyorOrderBucket(apiStatus) === tab;
}

/**
 * Resolve tab counts from API meta.counts.
 * Prefers byStatus so CAD_DELIVERED counts as completed even if the API
 * still buckets it under active.
 */
export function resolveSurveyorOrderCounts(counts = {}) {
  const byStatus = counts?.byStatus;
  if (byStatus && typeof byStatus === "object") {
    const sum = (statuses) =>
      statuses.reduce((n, s) => n + Number(byStatus[s] || 0), 0);
    const underReview = Number(byStatus.UNDER_REVIEW || 0);
    const active = sum(SURVEYOR_ACTIVE_STATUSES) + underReview;
    const completed = sum(SURVEYOR_COMPLETED_STATUSES);
    const cancelled = sum(SURVEYOR_CANCELLED_STATUSES);
    const all =
      Number(counts.all) ||
      Object.values(byStatus).reduce((n, v) => n + Number(v || 0), 0);
    return { all, active, completed, cancelled };
  }

  // Fallback when byStatus is missing: move CAD_DELIVERED out of active if present only in active totals
  const active = Number(counts?.active || 0);
  const completed = Number(counts?.completed || 0);
  return {
    all: Number(counts?.all || 0),
    active,
    completed,
    cancelled: Number(counts?.cancelled || 0),
  };
}
