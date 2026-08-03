/**
 * Shared sketch upload / revision pricing helpers (surveyor + admin display).
 */

/** @typedef {{ planAmountRupees?: number, discountRupees?: number, feePaise?: number, payableRupees?: number }} SketchPricingTier */

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Payable for one tier (upload or revision).
 * planAmountRupees > 0 → plan − discount (floored at 0).
 * Else → feePaise / 100.
 * @param {SketchPricingTier | null | undefined} tier
 */
export function computeSketchTierPayable(tier) {
  if (!tier || typeof tier !== "object") return 0;
  if (tier.payableRupees != null && Number.isFinite(Number(tier.payableRupees))) {
    return Math.max(0, Number(tier.payableRupees));
  }
  const plan = num(tier.planAmountRupees, 0);
  const disc = num(tier.discountRupees, 0);
  if (plan > 0) {
    return Math.max(0, plan - disc);
  }
  return Math.max(0, num(tier.feePaise, 0) / 100);
}

export function feePaiseToRupees(feePaise) {
  return Math.max(0, num(feePaise, 0) / 100);
}

/**
 * UI breakdown line for one tier (before Google superimpose add-on).
 * @param {SketchPricingTier | null | undefined} tier
 */
export function sketchTierBreakdownParts(tier) {
  const plan = num(tier?.planAmountRupees, 0);
  const disc = num(tier?.discountRupees, 0);
  const feeRupees = feePaiseToRupees(tier?.feePaise);
  if (plan > 0) {
    const appliedDiscount = Math.min(disc, plan);
    return {
      baseDisplayRupees: plan,
      discountDisplayRupees: appliedDiscount,
      afterDiscountRupees: Math.max(0, plan - disc),
    };
  }
  return {
    baseDisplayRupees: feeRupees,
    discountDisplayRupees: 0,
    afterDiscountRupees: feeRupees,
  };
}

/** Client fallback only for coerce shape when a tier is partially missing — not for display totals. */
export const FALLBACK_SURVEYOR_SKETCH_PRICING = {
  upload: {
    planAmountRupees: 0,
    discountRupees: 0,
    feePaise: 0,
    payableRupees: 0,
    source: "none",
  },
  revision: {
    planAmountRupees: 0,
    discountRupees: 0,
    feePaise: 0,
    payableRupees: 0,
    source: "none",
  },
  balance: {
    planAmountRupees: 0,
    discountRupees: 0,
    feePaise: 0,
    payableRupees: 0,
    source: "none",
  },
  /** No client-invented superimpose fee — only server-provided amounts count. */
  superimposeAddOnRupees: 0,
};

/**
 * @deprecated PRICE-01 — GST must come from the backend. Kept as 0 so callers
 * that still read GST_PERCENT do not invent a tax line.
 */
export const GST_PERCENT = 0;
export const GST_RATE = 0;

/**
 * Coerce a server add-on object or number into rupees.
 * @param {unknown} addon
 * @returns {number | null}
 */
function coerceAddOnRupees(addon) {
  if (addon == null) return null;
  if (typeof addon === "number" && Number.isFinite(addon)) {
    return Math.max(0, addon);
  }
  if (typeof addon === "string" && addon.trim() !== "" && Number.isFinite(Number(addon))) {
    return Math.max(0, Number(addon));
  }
  if (typeof addon !== "object") return null;
  if (addon.payableRupees != null && Number.isFinite(Number(addon.payableRupees))) {
    return Math.max(0, Number(addon.payableRupees));
  }
  if (addon.amountRupees != null && Number.isFinite(Number(addon.amountRupees))) {
    return Math.max(0, Number(addon.amountRupees));
  }
  if (addon.feePaise != null && Number.isFinite(Number(addon.feePaise))) {
    return Math.max(0, Number(addon.feePaise) / 100);
  }
  return null;
}

/**
 * Server-provided Google Superimpose add-on in rupees (0 if absent — never invent a default).
 * Accepts normalized pricing (`superimposeAddOnRupees`) or raw payload shapes.
 * @param {any} pricing
 */
export function getSuperimposeAddOnRupees(pricing) {
  if (pricing == null) return 0;
  if (typeof pricing === "number") return Math.max(0, num(pricing, 0));
  if (
    pricing.superimposeAddOnRupees != null &&
    Number.isFinite(Number(pricing.superimposeAddOnRupees))
  ) {
    return Math.max(0, Number(pricing.superimposeAddOnRupees));
  }
  const from =
    coerceAddOnRupees(pricing.superimpose) ??
    coerceAddOnRupees(pricing.googleSuperimpose) ??
    coerceAddOnRupees(pricing.addons?.superimpose) ??
    coerceAddOnRupees(pricing.addons?.googleSuperimpose);
  if (from != null) return from;

  // Backend may expose combined uploadWithSuperimpose — derive add-on vs base upload.
  const withSi = coerceAddOnRupees(pricing.uploadWithSuperimpose);
  const base =
    coerceAddOnRupees(pricing.upload) ??
    (pricing.upload && Number.isFinite(Number(pricing.upload.payableRupees))
      ? Math.max(0, Number(pricing.upload.payableRupees))
      : null);
  if (withSi != null && base != null && withSi >= base) {
    return Math.max(0, withSi - base);
  }
  return 0;
}

/**
 * Final rupees for sketch upload estimate (PRICE-01).
 * Uses backend tier `payableRupees` (+ server superimpose add-on). Never invents GST/tax.
 */
export function computeSketchSubmitAmountRupees({
  uploadTier,
  revisionTier,
  isRevision,
  isGoogleSuperimpose,
  superimposeAddOnRupees = 0,
  /** Optional server tax/GST already computed into payable — ignored for invention. */
  gstAmountRupees = 0,
}) {
  const uploadAmount = computeSketchTierPayable(uploadTier);
  const revisionAmount = computeSketchTierPayable(revisionTier);
  let baseAmountRupees = isRevision ? revisionAmount : uploadAmount;
  if (isGoogleSuperimpose) {
    baseAmountRupees += Math.max(0, num(superimposeAddOnRupees, 0));
  }
  // Only add GST when the API explicitly provided a tax amount (never invent %).
  return baseAmountRupees + Math.max(0, num(gstAmountRupees, 0));
}

export function buildSketchCheckoutBreakdown({
  upload,
  revision,
  isRevision,
  isGoogleSuperimpose,
  superimposeAddOnRupees = 0,
  gstAmountRupees = 0,
  gstPercent = null,
}) {
  const uploadAmount = computeSketchTierPayable(upload);
  const revisionAmount = computeSketchTierPayable(revision);
  const tier = isRevision ? revision : upload;
  const parts = sketchTierBreakdownParts(tier);
  const addOn = Math.max(0, num(superimposeAddOnRupees, 0));
  const googleFeeRupees = isGoogleSuperimpose ? addOn : 0;
  const afterTier = isRevision ? revisionAmount : uploadAmount;
  const baseAmountRupees = afterTier + googleFeeRupees;
  const tax = Math.max(0, num(gstAmountRupees, 0));
  const finalPayableRupees = baseAmountRupees + tax;
  const resolvedGstPercent =
    gstPercent != null && Number.isFinite(Number(gstPercent))
      ? Number(gstPercent)
      : tax > 0 && baseAmountRupees > 0
        ? Math.round((tax / baseAmountRupees) * 1000) / 10
        : null;
  return {
    ...parts,
    uploadAmount,
    revisionAmount,
    googleFeeRupees,
    superimposeAddOnRupees: addOn,
    baseAmountRupees,
    gstPercent: resolvedGstPercent,
    gstAmountRupees: tax,
    isGoogleSuperimpose: Boolean(isGoogleSuperimpose),
    isRevision: Boolean(isRevision),
    finalPayableRupees,
  };
}

/**
 * Normalize surveyor GET /api/surveyor/sketch-pricing payloads.
 * @param {any} raw
 * @returns {{ upload: SketchPricingTier, revision: SketchPricingTier, balance: SketchPricingTier, superimposeAddOnRupees: number }}
 */
export function normalizeSurveyorSketchPricingPayload(raw) {
  const root = raw?.data ?? raw;
  const upload =
    root?.upload ??
    root?.uploadPricing ??
    root?.sketchUpload ??
    (typeof root === "object" && root?.planAmountRupees !== undefined ? root : null);
  const revision =
    root?.revision ??
    root?.revisionPricing ??
    root?.sketchRevision ??
    root?.revisionPrice;
  const balance =
    root?.balance ?? root?.balancePricing ?? root?.sketchBalance ?? root?.downloadBalance;

  const coerce = (t, fb) => {
    let plan = num(t?.planAmountRupees ?? t?.planRupees, 0);
    const planPaise = num(t?.planAmountPaise, 0);
    if (plan <= 0 && planPaise > 0) plan = planPaise / 100;

    let disc = num(t?.discountRupees ?? t?.discount, 0);
    const discPaise = num(t?.discountPaise, 0);
    if (disc <= 0 && discPaise > 0) disc = discPaise / 100;

    const feePaise = num(t?.feePaise ?? t?.fee_paise, num(fb.feePaise, 0));
    const payableFromApi = num(t?.payableRupees, NaN);

    return {
      planAmountRupees: plan,
      discountRupees: disc,
      feePaise,
      ...(Number.isFinite(payableFromApi) ? { payableRupees: payableFromApi } : {}),
      ...(t?.source != null ? { source: t.source } : {}),
    };
  };

  const superimposeAddOnRupees = getSuperimposeAddOnRupees(root);
  const gstAmountRupees = num(
    root?.gstAmountRupees ?? root?.taxRupees ?? root?.gst?.amountRupees,
    0
  );
  const gstPercentRaw = root?.gstPercent ?? root?.taxPercent ?? root?.gst?.percent;
  const gstPercent =
    gstPercentRaw != null && Number.isFinite(Number(gstPercentRaw))
      ? Number(gstPercentRaw)
      : null;

  return {
    upload: coerce(upload, FALLBACK_SURVEYOR_SKETCH_PRICING.upload),
    revision: coerce(revision, FALLBACK_SURVEYOR_SKETCH_PRICING.revision),
    balance: coerce(balance, FALLBACK_SURVEYOR_SKETCH_PRICING.balance),
    superimposeAddOnRupees,
    gstAmountRupees,
    gstPercent,
  };
}
