import apiClient from "../apiClient.js";

const BASE = "/api/admin/survey-sketch-pricing";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/**
 * @returns {Promise<any>}
 */
export async function getAdminSurveySketchPricing() {
  try {
    const { data } = await apiClient.get(BASE);
    return data;
  } catch (error) {
    handleError(error, "Failed to load sketch pricing");
  }
}

/**
 * @param {Record<string, number | undefined>} patchBody
 * @returns {Promise<any>}
 */
export async function patchAdminSurveySketchPricing(patchBody) {
  try {
    const { data } = await apiClient.patch(BASE, patchBody);
    return data;
  } catch (error) {
    handleError(error, "Failed to update sketch pricing");
  }
}

const ADMIN_KEYS = [
  "sketchUploadPlanAmountRupees",
  "sketchUploadDiscountRupees",
  "sketchRevisionPlanAmountRupees",
  "sketchRevisionDiscountRupees",
];

/**
 * @param {any} raw
 * @returns {Record<string, number>}
 */
export function normalizeAdminSketchPricingRecord(raw) {
  const root = raw?.data ?? raw;
  const out = {};
  for (const k of ADMIN_KEYS) {
    const v = root?.[k];
    const n = Number(v);
    out[k] = Number.isFinite(n) ? n : 0;
  }
  return out;
}
