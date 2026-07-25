import apiClient from "../apiClient.js";
import { normalizeSurveyorSketchPricingPayload } from "../../utils/sketchPricingCompute.js";

const BASE = "/api/surveyor/sketch-uploads";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** C-01: never send client-set charge amounts on sketch payment APIs. */
const CLIENT_AMOUNT_KEYS = [
  "amount",
  "amountRupees",
  "amountPaise",
  "payableAmountRupees",
  "payableAmountPaise",
  "finalAmountRupees",
  "finalAmountPaise",
  "totalAmountRupees",
  "totalAmountPaise",
  "totalPayableRupees",
  "pricingSummary",
  "expectedAmountPaise",
];

function stripClientAmountFields(payload) {
  const body = { ...(payload || {}) };
  CLIENT_AMOUNT_KEYS.forEach((k) => {
    delete body[k];
  });
  return body;
}

/**
 * Create Surveyor Sketch Upload
 * POST /api/surveyor/sketch-uploads
 * @param {{
 *   surveyType: "joint_flat" | "single_flat",
 *   district: string, // ObjectId
 *   taluka: string, // ObjectId
 *   hobli: string, // ObjectId
 *   village: string, // ObjectId
 *   surveyNo: string,
 *   moolaTippani?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   hissaTippani?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   atlas?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   rrPakkabook?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   kharabu?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   audio?: { url: string, fileUrl: string, fileName?: string, mimeType?: string, size?: number },
 *   others?: string,
 *   isSuperimpose?: boolean
 * }} payload
 * Do NOT send amount / amountRupees / amountPaise / pricingSummary amounts —
 * server owns expectedAmountPaise (CLIENT_AMOUNT_NOT_ALLOWED if sent).
 * @returns {Promise<{ success: boolean, data: any, meta?: { payment?: object } }>}
 */
export async function createSketchUpload(payload) {
  try {
    // Defensive strip — browser must never set charge amount (C-01 / §4.1 point 25).
    const body = stripClientAmountFields(payload);
    const { data } = await apiClient.post(BASE, body);
    return data;
  } catch (error) {
    handleError(error, "Failed to create sketch upload");
  }
}

/**
 * Get Sketch Upload by ID
 * GET /api/surveyor/sketch-uploads/{id}
 */
export async function getSketchUploadById(id) {
  try {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch sketch upload");
  }
}

/**
 * List Sketch Uploads (with query params: page, limit, status, etc.)
 * GET /api/surveyor/sketch-uploads
 */
export async function getSketchUploads(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch sketch uploads");
  }
}

/**
 * List surveyor orders with bucket counts
 * GET /api/surveyor/orders
 * @param {{
 *  bucket?: "all" | "active" | "completed" | "cancelled",
 *  page?: number,
 *  limit?: number
 * }} params
 * Bucket rules (frontend; status query overrides API bucket when needed):
 * - active: PAYMENT_PENDING, PENDING, ASSIGNED, UNDER_REVISION
 * - completed: CAD_DELIVERED, APPROVED
 * - cancelled: REJECTED
 * @returns {Promise<{ success: boolean, data: any[], meta: any }>}
 */
export async function getSurveyorOrders(params = {}) {
  try {
    const { data } = await apiClient.get("/api/surveyor/orders", { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch surveyor orders");
  }
}

/**
 * Retry initial sketch upload payment (PhonePe) when payment failed or was abandoned.
 * POST /api/surveyor/sketch-uploads/{uploadId}/retry-payment
 * Empty body — never send amount fields (C-01).
 * @param {string} uploadId
 * @returns {Promise<{ success: boolean, data: any, meta?: { payment?: object } }>}
 */
export async function retrySketchUploadPayment(uploadId) {
  try {
    const { data } = await apiClient.post(`${BASE}/${uploadId}/retry-payment`, {});
    return data;
  } catch (error) {
    handleError(error, "Failed to retry payment");
  }
}

/**
 * Request CAD revision for a sketch upload
 * POST /api/surveyor/sketch-uploads/{uploadId}/revision-request
 * Do NOT send amount / amountRupees / amountPaise — server prices revision (C-01).
 * @param {string} uploadId
 * @param {{ remarks?: string, audio?: { url: string, fileName?: string, mimeType?: string, size?: number } }} payload
 * @returns {Promise<{ success: boolean, data: any }>}
 */
export async function requestCadRevision(uploadId, payload = {}) {
  try {
    const body = stripClientAmountFields(payload);
    const { data } = await apiClient.post(`${BASE}/${uploadId}/revision-request`, body);
    return data;
  } catch (error) {
    handleError(error, "Failed to request revision");
  }
}

/**
 * Surveyor sketch pricing (upload + revision + balance tiers).
 * GET /api/surveyor/sketch-pricing
 */
export async function getSurveyorSketchPricing() {
  try {
    const { data } = await apiClient.get("/api/surveyor/sketch-pricing");
    return normalizeSurveyorSketchPricingPayload(data);
  } catch (error) {
    handleError(error, "Failed to fetch sketch pricing");
  }
}

/**
 * Pay CAD download balance (₹400 gate). Empty body — never send amount fields.
 * POST /api/surveyor/sketch-uploads/{uploadId}/balance-payment
 * @param {string} uploadId
 * @returns {Promise<{ success: boolean, data: any, meta?: { payment?: object } }>}
 */
export async function initiateBalancePayment(uploadId) {
  try {
    const { data } = await apiClient.post(`${BASE}/${uploadId}/balance-payment`, {});
    return data;
  } catch (error) {
    handleError(error, "Failed to start balance payment");
  }
}

/**
 * Get short-lived CAD download URLs (only when downloadEntitlement.granted).
 * GET /api/surveyor/sketch-uploads/{uploadId}/cad-download
 * @param {string} uploadId
 * @param {{ grantId?: string }} [params]
 * @returns {Promise<{ success: boolean, data: any }>}
 */
export async function getCadDownload(uploadId, params = {}) {
  try {
    const query = {};
    if (params?.grantId) query.grantId = params.grantId;
    const { data } = await apiClient.get(`${BASE}/${uploadId}/cad-download`, {
      params: query,
    });
    return data;
  } catch (error) {
    const code = error.response?.data?.code || error.response?.data?.error?.code;
    const message = error.response?.data?.message ?? error.message ?? "Failed to get CAD download";
    const err = new Error(message);
    if (code) err.code = code;
    err.status = error.response?.status;
    throw err;
  }
}
