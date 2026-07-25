/**
 * H-11 CAD operator earnings helpers.
 * Prefer public business-rules `cadOperatorEarnings` (FIXED ₹400) over legacy percent copy.
 */

/** @typedef {{
 *   model: string,
 *   payoutRupees: number,
 *   standardOrderGrossRupees: number,
 *   bookingRupees: number,
 *   balanceRupees: number,
 *   percent: number | null,
 *   ruleVersion: string | null,
 * }} CadOperatorEarnings */

export const FALLBACK_CAD_OPERATOR_EARNINGS = Object.freeze({
  model: "FIXED",
  payoutRupees: 400,
  standardOrderGrossRupees: 500,
  bookingRupees: 100,
  balanceRupees: 400,
  percent: null,
  ruleVersion: "CAD_PAYOUT_V1_FIXED_400",
});

const numOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * @param {any} raw
 * @returns {CadOperatorEarnings}
 */
export function normalizeCadOperatorEarnings(raw) {
  const fb = FALLBACK_CAD_OPERATOR_EARNINGS;
  const r = raw && typeof raw === "object" ? raw : {};
  const model = String(r.model ?? fb.model).toUpperCase() || fb.model;
  const percentRaw = r.percent;
  const percent =
    percentRaw == null || percentRaw === ""
      ? null
      : Number.isFinite(Number(percentRaw))
        ? Number(percentRaw)
        : null;

  return {
    model,
    payoutRupees: numOr(r.payoutRupees ?? r.payout, fb.payoutRupees),
    standardOrderGrossRupees: numOr(
      r.standardOrderGrossRupees ?? r.grossRupees ?? r.standardOrderGross,
      fb.standardOrderGrossRupees
    ),
    bookingRupees: numOr(r.bookingRupees ?? r.booking, fb.bookingRupees),
    balanceRupees: numOr(r.balanceRupees ?? r.balance, fb.balanceRupees),
    percent: model === "FIXED" ? null : percent,
    ruleVersion:
      r.ruleVersion != null && String(r.ruleVersion).trim() !== ""
        ? String(r.ruleVersion)
        : fb.ruleVersion,
  };
}

/**
 * @param {CadOperatorEarnings | null | undefined} earnings
 */
export function isFixedCadPayout(earnings) {
  const e = normalizeCadOperatorEarnings(earnings);
  return e.model === "FIXED" || e.percent == null;
}

/**
 * Admin / marketing summary — never invents “20% of payment”.
 * @param {CadOperatorEarnings | null | undefined} earnings
 */
export function formatCadOperatorEarningsCopy(earnings) {
  const e = normalizeCadOperatorEarnings(earnings);
  if (isFixedCadPayout(e)) {
    return `CAD operator earnings on the standard order are a fixed ₹${e.payoutRupees} (on ₹${e.standardOrderGrossRupees} = booking ₹${e.bookingRupees} + balance ₹${e.balanceRupees}).`;
  }
  return `CAD earnings are ${e.percent}% of surveyor payments on completed deliveries.`;
}

/**
 * Short label for statistic tiles (e.g. “Fixed ₹400”).
 * @param {CadOperatorEarnings | null | undefined} earnings
 */
export function formatCadPayoutRateLabel(earnings) {
  const e = normalizeCadOperatorEarnings(earnings);
  if (isFixedCadPayout(e)) {
    return `Fixed ₹${e.payoutRupees}`;
  }
  return `${e.percent}%`;
}

/**
 * Resolve display payout rupees for a ledger row.
 * Prefer settlement `payoutPaise` / `payoutRupees` over legacy percent-derived amounts.
 * @param {any} row
 * @param {number} [fallbackRupees]
 */
export function resolveLedgerPayoutRupees(row, fallbackRupees = 0) {
  const r = row ?? {};
  if (r.payoutRupees != null && Number.isFinite(Number(r.payoutRupees))) {
    return Number(r.payoutRupees) || 0;
  }
  if (r.payoutPaise != null && Number.isFinite(Number(r.payoutPaise))) {
    return (Number(r.payoutPaise) || 0) / 100;
  }
  if (r.amountRupees != null && Number.isFinite(Number(r.amountRupees))) {
    return Number(r.amountRupees) || 0;
  }
  if (r.amountPaise != null && Number.isFinite(Number(r.amountPaise))) {
    return (Number(r.amountPaise) || 0) / 100;
  }
  if (r.totalAmountRupees != null && Number.isFinite(Number(r.totalAmountRupees))) {
    return Number(r.totalAmountRupees) || 0;
  }
  if (r.totalRupees != null && Number.isFinite(Number(r.totalRupees))) {
    return Number(r.totalRupees) || 0;
  }
  return Number(fallbackRupees) || 0;
}

/**
 * Paise → rupees helper for settlement components.
 * @param {any} raw
 * @param {string} rupeesKey
 * @param {string} paiseKey
 */
export function settlementRupees(raw, rupeesKey, paiseKey) {
  const r = raw ?? {};
  if (r[rupeesKey] != null && Number.isFinite(Number(r[rupeesKey]))) {
    return Number(r[rupeesKey]) || 0;
  }
  if (r[paiseKey] != null && Number.isFinite(Number(r[paiseKey]))) {
    return (Number(r[paiseKey]) || 0) / 100;
  }
  return null;
}

/**
 * Normalize ledger settlement fields; prefer FIXED model metadata over legacy payoutPercent.
 * @param {any} raw
 */
export function mapLedgerSettlement(raw) {
  const e = raw ?? {};
  const payoutModelRaw = e.payoutModel ?? e.model;
  let payoutModel =
    payoutModelRaw != null && String(payoutModelRaw).trim() !== ""
      ? String(payoutModelRaw).toUpperCase()
      : null;

  const pricingRuleVersion =
    e.pricingRuleVersion ?? e.ruleVersion ?? e.cadPricingRuleVersion ?? null;

  const grossPriceRupees = settlementRupees(e, "grossPriceRupees", "grossPricePaise");
  const bookingRupees = settlementRupees(e, "bookingRupees", "bookingPaise");
  const balanceRupees = settlementRupees(e, "balanceRupees", "balancePaise");
  const payoutRupeesResolved = settlementRupees(e, "payoutRupees", "payoutPaise");
  const platformFeeRupees = settlementRupees(e, "platformFeeRupees", "platformFeePaise");

  if (!payoutModel && (payoutRupeesResolved != null || pricingRuleVersion)) {
    payoutModel = "FIXED";
  }
  if (!payoutModel && e.payoutPercent != null && Number(e.payoutPercent) > 0) {
    payoutModel = "PERCENT";
  }

  return {
    pricingRuleVersion:
      pricingRuleVersion != null && String(pricingRuleVersion).trim() !== ""
        ? String(pricingRuleVersion)
        : null,
    payoutModel,
    grossPricePaise:
      e.grossPricePaise != null ? Math.round(Number(e.grossPricePaise) || 0) : null,
    bookingPaise: e.bookingPaise != null ? Math.round(Number(e.bookingPaise) || 0) : null,
    balancePaise: e.balancePaise != null ? Math.round(Number(e.balancePaise) || 0) : null,
    payoutPaise: e.payoutPaise != null ? Math.round(Number(e.payoutPaise) || 0) : null,
    platformFeePaise:
      e.platformFeePaise != null ? Math.round(Number(e.platformFeePaise) || 0) : null,
    grossPriceRupees,
    bookingRupees,
    balanceRupees,
    payoutRupees: payoutRupeesResolved,
    platformFeeRupees,
    /** Legacy only — do not use for FIXED display copy. */
    payoutPercent:
      e.payoutPercent != null && Number.isFinite(Number(e.payoutPercent))
        ? Number(e.payoutPercent)
        : null,
  };
}
