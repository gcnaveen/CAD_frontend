/**
 * Returns a safe in-app path for a notification.
 * NOTIF-01 — SKETCH_PAYMENT_PENDING / payment types deep-link to Retry Payment.
 *
 * @param {"user"|"cad"|"superadmin"} layout
 * @param {string} [entityType]
 * @param {{
 *   type?: string,
 *   entityId?: string,
 *   data?: Record<string, unknown>,
 * }} [opts]
 * @returns {string | null}
 */
export function resolveNotificationPath(layout, entityType, opts = {}) {
  const t = (entityType || "").toString().toUpperCase();
  const type = String(opts.type || opts.data?.type || "")
    .toUpperCase()
    .replace(/[\s.-]+/g, "_");
  const data = opts.data && typeof opts.data === "object" ? opts.data : {};
  const entityId = String(
    opts.entityId ||
      data.uploadId ||
      data.sketchUploadId ||
      data.surveyorSketchUploadId ||
      data.entityId ||
      ""
  ).trim();

  const isPaymentPendingNotif =
    type === "SKETCH_PAYMENT_PENDING" ||
    type === "SURVEY_SKETCH_PAYMENT_PENDING" ||
    type.includes("PAYMENT_PENDING") ||
    type === "SKETCH_PAYMENT_FAILED" ||
    type === "SURVEY_SKETCH_PAYMENT_FAILED";

  if (isPaymentPendingNotif && layout === "user") {
    const qs = new URLSearchParams();
    if (entityId) qs.set("uploadId", entityId);
    qs.set("action", "retryPayment");
    return `/dashboard/user?${qs.toString()}`;
  }

  if (isPaymentPendingNotif && layout === "superadmin") {
    return entityId
      ? `/superadmin/projects?uploadId=${encodeURIComponent(entityId)}`
      : "/superadmin/projects";
  }

  const orderLike = new Set([
    "ORDER",
    "SKETCH",
    "SKETCH_UPLOAD",
    "UPLOAD",
    "SKETCHUPLOAD",
    "SURVEYORSKETCHUPLOAD",
    "SURVEY_SKETCH_UPLOAD",
  ]);

  if (orderLike.has(t) || type.includes("SKETCH") || type.includes("ASSIGN")) {
    if (layout === "user") {
      if (entityId) {
        return `/dashboard/user?uploadId=${encodeURIComponent(entityId)}`;
      }
      return "/dashboard/user/track-order";
    }
    if (layout === "cad") return "/dashboard/cad/current-orders";
    if (layout === "superadmin") return "/superadmin/projects";
    return null;
  }

  if (t === "PROJECT") {
    if (layout === "superadmin") return "/superadmin/projects";
    if (layout === "cad") return "/dashboard/cad/current-orders";
    return null;
  }

  return null;
}
