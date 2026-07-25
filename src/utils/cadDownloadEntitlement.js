/**
 * C-02 CAD download entitlement helpers (₹400 balance gate).
 * Surveyors must not use cadDeliverable[].url — drive UI from downloadEntitlement.
 */

import { canonicalizeSketchStatus } from "./lifecycleQc.js";

const PAY_REASONS = new Set([
  "BALANCE_PAYMENT_REQUIRED",
  "BALANCE_PAYMENT_FAILED",
  "FAILED",
  "AMOUNT_MISMATCH",
]);

const PENDING_REASONS = new Set(["BALANCE_PAYMENT_PENDING", "PENDING"]);

const REFUNDED_REASONS = new Set(["REFUNDED", "BALANCE_REFUNDED"]);

/**
 * @param {any} upload
 */
export function getDownloadEntitlement(upload) {
  return upload?.downloadEntitlement ?? null;
}

/**
 * @param {any} upload
 * @returns {boolean}
 */
export function isCadDownloadEntitled(upload) {
  return Boolean(getDownloadEntitlement(upload)?.granted);
}

/**
 * Resolve display payable for balance gate (prefer entitlement, then balancePayment, then pricing).
 * @param {any} upload
 * @param {number | null | undefined} [fallbackRupees]
 */
export function formatBalancePayableRupees(upload, fallbackRupees = 400) {
  const ent = getDownloadEntitlement(upload);
  const fromEnt = ent?.payableRupees;
  if (fromEnt != null && Number.isFinite(Number(fromEnt))) return Number(fromEnt);

  const fromEntPaise = ent?.amountPaise;
  if (fromEntPaise != null && Number.isFinite(Number(fromEntPaise))) {
    return Number(fromEntPaise) / 100;
  }

  const bal = upload?.balancePayment;
  const fromBal = bal?.payableRupees;
  if (fromBal != null && Number.isFinite(Number(fromBal))) return Number(fromBal);

  const fromBalPaise = bal?.amountPaise;
  if (fromBalPaise != null && Number.isFinite(Number(fromBalPaise))) {
    return Number(fromBalPaise) / 100;
  }

  if (fallbackRupees != null && Number.isFinite(Number(fallbackRupees))) {
    return Number(fallbackRupees);
  }
  return 400;
}

/**
 * UI action for CAD deliverables card.
 * @returns {"download" | "pay" | "pending" | "refunded" | "hidden"}
 */
export function getCadDownloadUiAction(upload) {
  const files = upload?.cadDeliverable;
  const hasDeliverableMeta =
    (Array.isArray(files) && files.length > 0) ||
    (files && typeof files === "object" && !Array.isArray(files));

  const status = canonicalizeSketchStatus(upload?.status);
  const delivered =
    status === "CAD_DELIVERED" ||
    status === "APPROVED" ||
    status === "UNDER_REVISION" ||
    hasDeliverableMeta;

  if (!delivered && !hasDeliverableMeta) return "hidden";

  const ent = getDownloadEntitlement(upload);
  if (!ent) {
    // Older payloads without entitlement: still block direct URL use when withheld.
    if (hasDeliverableMeta) {
      const list = Array.isArray(files) ? files : [files];
      const anyWithheld = list.some((f) => f?.urlWithheld || !f?.url);
      if (anyWithheld) return "pay";
    }
    return hasDeliverableMeta ? "download" : "hidden";
  }

  if (ent.granted) return "download";

  const reason = String(ent.reason || ent.balancePaymentStatus || "").toUpperCase();
  const balStatus = String(
    ent.balancePaymentStatus || upload?.balancePayment?.status || ""
  ).toUpperCase();

  if (REFUNDED_REASONS.has(reason) || balStatus === "REFUNDED") return "refunded";
  if (PENDING_REASONS.has(reason) || balStatus === "PENDING") return "pending";
  if (PAY_REASONS.has(reason) || balStatus === "REQUIRED" || balStatus === "FAILED") {
    return "pay";
  }
  if (reason.includes("REFUND")) return "refunded";
  if (reason.includes("PENDING")) return "pending";
  return "pay";
}

/**
 * Normalize CAD deliverable metadata for surveyors (url may be withheld).
 * @param {object|object[]|null|undefined} value
 */
export function normalizeCadDeliverableMeta(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter((file) => file && typeof file === "object")
    .map((file) => ({
      fileName: file.fileName || file.name || "CAD file",
      mimeType: file.mimeType || file.contentType || "application/octet-stream",
      size: file.size,
      uploadedAt: file.uploadedAt || file.createdAt,
      urlWithheld: Boolean(file.urlWithheld) || !file.url,
      // Never use surveyor list/detail URLs for download; keep only if present for admin-like payloads
      url: file.urlWithheld ? undefined : file.url,
    }));
}

/**
 * Human-readable message for cad-download denial codes.
 * @param {string} [code]
 */
export function cadDownloadDenialMessage(code) {
  const c = String(code || "").toUpperCase();
  switch (c) {
    case "NOT_YOUR_SKETCH":
      return "This order does not belong to your account.";
    case "CAD_NOT_DELIVERED":
      return "CAD files are not ready yet.";
    case "BALANCE_PAYMENT_REQUIRED":
      return "Pay the balance amount to unlock CAD download.";
    case "BALANCE_PAYMENT_PENDING":
      return "Balance payment is still pending. Complete checkout or try again shortly.";
    case "BALANCE_PAYMENT_FAILED":
    case "FAILED":
      return "Balance payment failed. Please try paying again.";
    case "AMOUNT_MISMATCH":
      return "Payment amount did not match the required balance. Contact support if this persists.";
    case "BALANCE_REFUNDED":
    case "REFUNDED":
      return "Balance payment was refunded. Download is blocked. Contact support.";
    case "DOWNLOAD_GRANT_REPLAYED":
      return "Download link was already used. Request a new download.";
    case "DOWNLOAD_GRANT_EXPIRED":
      return "Download link expired. Request a new download.";
    default:
      return "Unable to download CAD files.";
  }
}
