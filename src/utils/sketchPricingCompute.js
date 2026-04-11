/**
 * Shared sketch upload / revision pricing helpers (surveyor + admin display).
 */

/** @typedef {{ planAmountRupees?: number, discountRupees?: number, feePaise?: number }} SketchPricingTier */

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

export const FALLBACK_SURVEYOR_SKETCH_PRICING = {
  upload: { planAmountRupees: 0, discountRupees: 0, feePaise: 150 },
  revision: { planAmountRupees: 0, discountRupees: 0, feePaise: 10000 },
};

/** Added once to the sketch tier total when Google Superimpose is selected. */
export const GOOGLE_SUPERIMPOSE_CHARGE = 200;

/**
 * Final payable for checkout (upload wizard): tier amount + optional Google superimpose add-on.
 */
/**
 * Final rupees to charge for sketch upload POST (uses latest tier + superimpose; call at submit with form values).
 */
export function computeSketchSubmitAmountRupees({
  uploadTier,
  revisionTier,
  isRevision,
  isGoogleSuperimpose,
}) {
  const uploadAmount = computeSketchTierPayable(uploadTier);
  const revisionAmount = computeSketchTierPayable(revisionTier);
  let total = isRevision ? revisionAmount : uploadAmount;
  if (isGoogleSuperimpose) total += GOOGLE_SUPERIMPOSE_CHARGE;
  return total;
}

export function buildSketchCheckoutBreakdown({
  upload,
  revision,
  isRevision,
  isGoogleSuperimpose,
}) {
  const uploadAmount = computeSketchTierPayable(upload);
  const revisionAmount = computeSketchTierPayable(revision);
  const tier = isRevision ? revision : upload;
  const parts = sketchTierBreakdownParts(tier);
  const googleFeeRupees = isGoogleSuperimpose ? GOOGLE_SUPERIMPOSE_CHARGE : 0;
  const afterTier = isRevision ? revisionAmount : uploadAmount;
  const finalPayableRupees = afterTier + googleFeeRupees;
  return {
    ...parts,
    uploadAmount,
    revisionAmount,
    googleFeeRupees,
    isGoogleSuperimpose: Boolean(isGoogleSuperimpose),
    isRevision: Boolean(isRevision),
    finalPayableRupees,
  };
}

/**
 * Normalize surveyor GET /api/surveyor/sketch-pricing payloads.
 * @param {any} raw
 * @returns {{ upload: SketchPricingTier, revision: SketchPricingTier }}
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

  const coerce = (t, fb) => {
    let plan = num(t?.planAmountRupees ?? t?.planRupees, 0);
    const planPaise = num(t?.planAmountPaise, 0);
    if (plan <= 0 && planPaise > 0) plan = planPaise / 100;

    let disc = num(t?.discountRupees ?? t?.discount, 0);
    const discPaise = num(t?.discountPaise, 0);
    if (disc <= 0 && discPaise > 0) disc = discPaise / 100;

    return {
      planAmountRupees: plan,
      discountRupees: disc,
      feePaise: num(t?.feePaise ?? t?.fee_paise, num(fb.feePaise, 0)),
    };
  };

  return {
    upload: coerce(upload, FALLBACK_SURVEYOR_SKETCH_PRICING.upload),
    revision: coerce(revision, FALLBACK_SURVEYOR_SKETCH_PRICING.revision),
  };
}
