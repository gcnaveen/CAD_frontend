/**
 * CAD-02 — consume additive BE fields:
 *   workflowPhase / primaryMode / exclusiveModes
 * so Upload, Revision, and Completed UI never coexist.
 *
 * Falls back to assignment status heuristics when fields are absent.
 */

export const CAD_PRIMARY_MODE = Object.freeze({
  ACCEPT: "ACCEPT",
  UPLOAD: "UPLOAD",
  REVISION: "REVISION",
  COMPLETED: "COMPLETED",
  VIEW: "VIEW",
});

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeCadPrimaryMode(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!s) return null;
  if (
    s === "ACCEPT" ||
    s === "PENDING_ACCEPT" ||
    s === "AWAITING_ACCEPT" ||
    s === "ASSIGNED"
  ) {
    return CAD_PRIMARY_MODE.ACCEPT;
  }
  if (
    s === "UPLOAD" ||
    s === "CAD_UPLOAD" ||
    s === "DELIVER" ||
    s === "DELIVERY" ||
    s === "IN_PROGRESS"
  ) {
    return CAD_PRIMARY_MODE.UPLOAD;
  }
  if (
    s === "REVISION" ||
    s === "REVISE" ||
    s === "NEED_CHANGES" ||
    s === "CHANGES_REQUIRED" ||
    s === "UNDER_REVISION"
  ) {
    return CAD_PRIMARY_MODE.REVISION;
  }
  if (
    s === "COMPLETED" ||
    s === "COMPLETE" ||
    s === "DONE" ||
    s === "APPROVED" ||
    s === "CAD_DELIVERED"
  ) {
    return CAD_PRIMARY_MODE.COMPLETED;
  }
  if (s === "VIEW" || s === "READONLY" || s === "READ_ONLY") {
    return CAD_PRIMARY_MODE.VIEW;
  }
  return null;
}

/**
 * @param {unknown} exclusiveRaw
 * @param {boolean} hasPrimaryFromApi
 */
function resolveExclusiveFlag(exclusiveRaw, hasPrimaryFromApi) {
  if (exclusiveRaw === true) return true;
  if (exclusiveRaw === false) return false;
  if (Array.isArray(exclusiveRaw)) return exclusiveRaw.length > 0;
  // CAD-02: default exclusive so Upload / Revision / Completed never stack,
  // whether primaryMode comes from BE or status heuristics.
  void hasPrimaryFromApi;
  return true;
}

/**
 * @param {object | null | undefined} order — mapped CAD order or raw assignment
 * @returns {{
 *   workflowPhase: string | null,
 *   primaryMode: string,
 *   exclusiveModes: boolean,
 *   detailsLocked: boolean,
 *   showUploadPanel: boolean,
 *   showRevisionPanel: boolean,
 *   showDeliverables: boolean,
 *   showAcceptActions: boolean,
 *   showUploadAction: boolean,
 * }}
 */
export function resolveCadWorkflowUi(order) {
  const raw = order?.rawAssignment && typeof order.rawAssignment === "object"
    ? order.rawAssignment
    : order || {};
  const sketch =
    (order?.sketchUpload && typeof order.sketchUpload === "object"
      ? order.sketchUpload
      : null) ||
    (raw?.surveyorSketchUpload && typeof raw.surveyorSketchUpload === "object"
      ? raw.surveyorSketchUpload
      : {}) ||
    {};

  const primaryFromApi =
    normalizeCadPrimaryMode(order?.primaryMode) ||
    normalizeCadPrimaryMode(raw?.primaryMode) ||
    normalizeCadPrimaryMode(sketch?.primaryMode) ||
    normalizeCadPrimaryMode(order?.workflowPhase) ||
    normalizeCadPrimaryMode(raw?.workflowPhase) ||
    normalizeCadPrimaryMode(sketch?.workflowPhase);

  const exclusiveModes = resolveExclusiveFlag(
    order?.exclusiveModes ?? raw?.exclusiveModes ?? sketch?.exclusiveModes,
    Boolean(primaryFromApi)
  );

  const status = String(order?.status || raw?.status || "")
    .trim()
    .toUpperCase();
  const isAccepted =
    typeof order?.isAccepted === "boolean"
      ? order.isAccepted
      : status !== "ASSIGNED" && status !== "PENDING" && status !== "CANCELLED";

  let primaryMode = primaryFromApi;
  if (!primaryMode) {
    if (status === "ASSIGNED" || isAccepted === false) {
      primaryMode = CAD_PRIMARY_MODE.ACCEPT;
    } else if (status === "NEED_CHANGES") {
      primaryMode = CAD_PRIMARY_MODE.REVISION;
    } else if (status === "COMPLETED") {
      primaryMode = CAD_PRIMARY_MODE.COMPLETED;
    } else if (status === "IN_PROGRESS" || status === "ON_HOLD") {
      primaryMode = CAD_PRIMARY_MODE.UPLOAD;
    } else {
      primaryMode = CAD_PRIMARY_MODE.VIEW;
    }
  }

  const workflowPhase = String(
    order?.workflowPhase || raw?.workflowPhase || sketch?.workflowPhase || primaryMode || ""
  )
    .trim()
    .toUpperCase() || null;

  const detailsLocked =
    primaryMode === CAD_PRIMARY_MODE.ACCEPT ||
    status === "ASSIGNED" ||
    isAccepted === false;

  // Non-exclusive only when BE explicitly sets exclusiveModes: false.
  if (!exclusiveModes) {
    return {
      workflowPhase,
      primaryMode,
      exclusiveModes: false,
      detailsLocked,
      showUploadPanel: !detailsLocked,
      showRevisionPanel: !detailsLocked,
      showDeliverables: !detailsLocked,
      showAcceptActions: primaryMode === CAD_PRIMARY_MODE.ACCEPT,
      showUploadAction:
        primaryMode === CAD_PRIMARY_MODE.UPLOAD ||
        primaryMode === CAD_PRIMARY_MODE.REVISION,
    };
  }

  // Exclusive: Upload / Revision / Completed never coexist as action surfaces.
  // Revision *history* may still show on COMPLETED / VIEW (read-only).
  const showUploadPanel =
    primaryMode === CAD_PRIMARY_MODE.UPLOAD ||
    primaryMode === CAD_PRIMARY_MODE.REVISION;
  const showRevisionPanel =
    primaryMode === CAD_PRIMARY_MODE.REVISION ||
    primaryMode === CAD_PRIMARY_MODE.COMPLETED ||
    primaryMode === CAD_PRIMARY_MODE.VIEW;
  const showDeliverables =
    !detailsLocked &&
    (primaryMode === CAD_PRIMARY_MODE.UPLOAD ||
      primaryMode === CAD_PRIMARY_MODE.REVISION ||
      primaryMode === CAD_PRIMARY_MODE.COMPLETED ||
      primaryMode === CAD_PRIMARY_MODE.VIEW);

  return {
    workflowPhase,
    primaryMode,
    exclusiveModes: true,
    detailsLocked,
    showUploadPanel,
    showRevisionPanel,
    showDeliverables,
    showAcceptActions: primaryMode === CAD_PRIMARY_MODE.ACCEPT,
    showUploadAction:
      primaryMode === CAD_PRIMARY_MODE.UPLOAD ||
      primaryMode === CAD_PRIMARY_MODE.REVISION,
  };
}
