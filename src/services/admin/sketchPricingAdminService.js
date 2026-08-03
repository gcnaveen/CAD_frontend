import apiClient from "../apiClient.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";

const BASE = "/api/admin/survey-sketch-pricing";

/** Env fallback aligned with booking ₹100 upload (+ ₹400 balance = ₹500). */
export const DEFAULT_UPLOAD_FEE_PAISE = 10000;
export const DEFAULT_REVISION_FEE_PAISE = 10000;
export const DEFAULT_BALANCE_FEE_PAISE = 40000;

function handleError(error, fallbackMessage) {
  throw new Error(getApiErrorMessage(error, fallbackMessage));
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
  "sketchBalancePlanAmountRupees",
  "sketchBalanceDiscountRupees",
];

/**
 * Preserve null/empty as null (unset admin plan → env-resolved fee).
 * @param {unknown} v
 * @returns {number | null}
 */
export function coerceOptionalRupees(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {any} tier
 * @param {number} defaultFeePaise
 * @returns {{
 *   feePaise: number,
 *   payableRupees: number,
 *   planAmountRupees: number | null,
 *   discountRupees: number | null,
 *   source: string | null,
 * }}
 */
export function normalizeResolvedPricingTier(tier, defaultFeePaise) {
  if (tier && typeof tier === "object") {
    const feePaiseRaw = Number(tier.feePaise ?? tier.fee_paise);
    const payableRaw = Number(tier.payableRupees);
    const plan = coerceOptionalRupees(tier.planAmountRupees);
    const discount = coerceOptionalRupees(tier.discountRupees);

    let feePaise = Number.isFinite(feePaiseRaw) ? Math.max(0, feePaiseRaw) : null;
    let payableRupees = Number.isFinite(payableRaw) ? Math.max(0, payableRaw) : null;

    if (payableRupees == null && feePaise != null) {
      payableRupees = feePaise / 100;
    }
    if (feePaise == null && payableRupees != null) {
      feePaise = Math.round(payableRupees * 100);
    }
    if (payableRupees == null && plan != null && plan > 0) {
      payableRupees = Math.max(0, plan - (discount ?? 0));
      feePaise = Math.round(payableRupees * 100);
    }
    if (payableRupees == null) {
      feePaise = defaultFeePaise;
      payableRupees = defaultFeePaise / 100;
    }

    return {
      feePaise,
      payableRupees,
      planAmountRupees: plan,
      discountRupees: discount,
      source: tier.source != null ? String(tier.source) : null,
    };
  }

  return {
    feePaise: defaultFeePaise,
    payableRupees: defaultFeePaise / 100,
    planAmountRupees: null,
    discountRupees: null,
    source: "env",
  };
}

/**
 * Normalize admin GET /api/admin/survey-sketch-pricing.
 * Plan fields stay null when unset; `resolved` holds server fee breakdown (rupees).
 * @param {any} raw
 * @returns {Record<string, number | null> & {
 *   resolved: {
 *     upload: ReturnType<typeof normalizeResolvedPricingTier>,
 *     revision: ReturnType<typeof normalizeResolvedPricingTier>,
 *     balance: ReturnType<typeof normalizeResolvedPricingTier>,
 *   }
 * }}
 */
export function normalizeAdminSketchPricingRecord(raw) {
  const root = raw?.data ?? raw;
  const pricing = root?.pricing ?? {};
  const out = {};
  for (const k of ADMIN_KEYS) {
    out[k] = coerceOptionalRupees(root?.[k]);
  }
  out.resolved = {
    upload: normalizeResolvedPricingTier(
      pricing.upload,
      DEFAULT_UPLOAD_FEE_PAISE
    ),
    revision: normalizeResolvedPricingTier(
      pricing.revision,
      DEFAULT_REVISION_FEE_PAISE
    ),
    balance: normalizeResolvedPricingTier(
      pricing.balance,
      DEFAULT_BALANCE_FEE_PAISE
    ),
  };
  return out;
}

/**
 * Form field values only (no resolved breakdown).
 * @param {ReturnType<typeof normalizeAdminSketchPricingRecord>} rec
 */
export function adminPricingFormValues(rec) {
  const out = {};
  for (const k of ADMIN_KEYS) {
    out[k] = rec?.[k] ?? null;
  }
  return out;
}
