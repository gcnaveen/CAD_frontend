import {
  FALLBACK_LIFECYCLE_MACHINE,
  canonicalizeSketchStatus,
  getSketchStatusLabel,
} from "./lifecycleQc.js";

/**
 * Surveyor-facing sketch status labels — from lifecycleMachine only (M-08).
 * Do not invent names from PRD/handoff decks.
 */
export const SURVEYOR_ORDER_STATUS_LABELS = Object.freeze({
  ...FALLBACK_LIFECYCLE_MACHINE.labels,
});

/** Pill styles keyed by canonical status code (not display label). */
export const SURVEYOR_ORDER_STATUS_STYLES = {
  PAYMENT_PENDING:
    "border-line bg-[color-mix(in_srgb,var(--warning)_14%,var(--bg-secondary))] text-[var(--warning)]",
  PENDING:
    "border-line bg-[color-mix(in_srgb,var(--user-accent)_14%,var(--bg-secondary))] text-[var(--user-accent)]",
  ASSIGNED:
    "border-line bg-[color-mix(in_srgb,var(--cyan-accent)_12%,var(--bg-secondary))] text-[var(--cyan-accent)]",
  CAD_DELIVERED:
    "border-line bg-[color-mix(in_srgb,var(--violet-accent)_12%,var(--bg-secondary))] text-[var(--violet-accent)]",
  UNDER_REVISION:
    "border-line bg-[color-mix(in_srgb,var(--warning)_12%,var(--bg-secondary))] text-[var(--warning)]",
  APPROVED:
    "border-line bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] text-success",
  REJECTED:
    "border-line bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg-secondary))] text-danger",
};

/**
 * Status bucket rules for surveyor dashboard / requests tabs (BIZ-10 terminals).
 * - active: PAYMENT_PENDING, PENDING, ASSIGNED, CAD_DELIVERED, UNDER_REVISION
 * - completed: APPROVED
 * - cancelled: REJECTED
 */
export const SURVEYOR_ACTIVE_STATUSES = [
  "PAYMENT_PENDING",
  "PENDING",
  "ASSIGNED",
  "CAD_DELIVERED",
  "UNDER_REVISION",
];
export const SURVEYOR_COMPLETED_STATUSES = ["APPROVED"];
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
  return getSketchStatusLabel(apiStatus);
}

export function getSurveyorOrderStatusStyle(apiStatus) {
  const code = canonicalizeSketchStatus(apiStatus);
  return (
    SURVEYOR_ORDER_STATUS_STYLES[code] || SURVEYOR_ORDER_STATUS_STYLES.PENDING
  );
}

/** Returns tab bucket, or null when the status only appears under "all". */
export function getSurveyorOrderBucket(apiStatus) {
  const status = canonicalizeSketchStatus(apiStatus);
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
 * Prefers byStatus so CAD_DELIVERED stays in active until admin APPROVED.
 * Legacy UNDER_REVIEW rolls into UNDER_REVISION (active).
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

  return {
    all: Number(counts?.all || 0),
    active: Number(counts?.active || 0),
    completed: Number(counts?.completed || 0),
    cancelled: Number(counts?.cancelled || 0),
  };
}
