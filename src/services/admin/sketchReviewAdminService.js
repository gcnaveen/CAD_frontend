import apiClient from "../apiClient.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";
import { canonicalizeSketchStatus } from "../../utils/lifecycleQc.js";
import { isSketchBookingUnpaid } from "../../utils/sketchPaymentUtils.js";

const REVIEW_DECISIONS = new Set(["APPROVED", "REJECTED"]);

/** Lifecycle statuses that may be APPROVED via review API. */
export const REVIEW_APPROVE_FROM = Object.freeze(["CAD_DELIVERED"]);

/** Lifecycle statuses that may be REJECTED via review API. */
export const REVIEW_REJECT_FROM = Object.freeze([
  "PAYMENT_PENDING",
  "PENDING",
  "ASSIGNED",
  "CAD_DELIVERED",
  "UNDER_REVISION",
]);

const APPROVE_SET = new Set(REVIEW_APPROVE_FROM);
const REJECT_SET = new Set(REVIEW_REJECT_FROM);

function handleError(error, fallbackMessage) {
  const message = getApiErrorMessage(error, fallbackMessage);
  const err = new Error(message);
  err.status = error?.response?.status;
  err.data = error?.response?.data;
  err.code = error?.response?.data?.code ?? error?.response?.data?.error ?? null;
  if (error?.correlationId) err.correlationId = error.correlationId;
  throw err;
}

function unwrapData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

/**
 * @param {unknown} upload
 * @returns {boolean}
 */
export function canAdminApproveSketch(upload) {
  const st = canonicalizeSketchStatus(upload?.status);
  if (!APPROVE_SET.has(st)) return false;
  return !isSketchBookingUnpaid(upload);
}

/**
 * @param {unknown} upload
 * @returns {boolean}
 */
export function canAdminRejectSketch(upload) {
  const st = canonicalizeSketchStatus(upload?.status);
  return REJECT_SET.has(st);
}

/**
 * POST /api/admin/sketch-uploads/{uploadId}/review
 * Terminal review — APPROVED or REJECTED only (BIZ-10). Do not free-form PATCH status.
 *
 * @param {string} uploadId
 * @param {{ decision: "APPROVED" | "REJECTED", note?: string }} body
 */
export async function reviewSketchUpload(uploadId, body = {}) {
  if (!uploadId) throw new Error("uploadId is required");
  const decision = String(body?.decision || "")
    .trim()
    .toUpperCase();
  if (!REVIEW_DECISIONS.has(decision)) {
    throw new Error('decision must be "APPROVED" or "REJECTED"');
  }

  const payload = { decision };
  if (body?.note != null && String(body.note).trim() !== "") {
    payload.note = String(body.note).trim().slice(0, 500);
  }

  try {
    const { data } = await apiClient.post(
      `/api/admin/sketch-uploads/${uploadId}/review`,
      payload
    );
    return unwrapData(data) ?? data;
  } catch (error) {
    handleError(error, "Failed to submit sketch review");
  }
}
