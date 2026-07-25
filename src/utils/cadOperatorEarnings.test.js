import { describe, expect, it } from "vitest";
import {
  FALLBACK_CAD_OPERATOR_EARNINGS,
  formatCadOperatorEarningsCopy,
  formatCadPayoutRateLabel,
  isFixedCadPayout,
  mapLedgerSettlement,
  normalizeCadOperatorEarnings,
  resolveLedgerPayoutRupees,
} from "./cadOperatorEarnings.js";
import { normalizePublicBusinessRules } from "../services/public/businessRulesService.js";

describe("normalizeCadOperatorEarnings", () => {
  it("defaults to FIXED ₹400", () => {
    expect(normalizeCadOperatorEarnings(null)).toEqual(FALLBACK_CAD_OPERATOR_EARNINGS);
  });

  it("maps public rules payload", () => {
    expect(
      normalizeCadOperatorEarnings({
        model: "FIXED",
        payoutRupees: 400,
        standardOrderGrossRupees: 500,
        bookingRupees: 100,
        balanceRupees: 400,
        percent: null,
        ruleVersion: "CAD_PAYOUT_V1_FIXED_400",
      })
    ).toMatchObject({
      model: "FIXED",
      payoutRupees: 400,
      percent: null,
      ruleVersion: "CAD_PAYOUT_V1_FIXED_400",
    });
  });

  it("nulls percent when model is FIXED even if percent is sent", () => {
    expect(normalizeCadOperatorEarnings({ model: "FIXED", percent: 20 }).percent).toBeNull();
  });
});

describe("formatCadOperatorEarningsCopy", () => {
  it("describes fixed payout without 20%", () => {
    const copy = formatCadOperatorEarningsCopy(FALLBACK_CAD_OPERATOR_EARNINGS);
    expect(copy).toContain("fixed ₹400");
    expect(copy).toContain("₹500");
    expect(copy).toContain("booking ₹100");
    expect(copy).toContain("balance ₹400");
    expect(copy.toLowerCase()).not.toContain("20%");
    expect(copy).not.toMatch(/₹100 on a ₹500/i);
  });

  it("rate label is Fixed ₹400", () => {
    expect(formatCadPayoutRateLabel(FALLBACK_CAD_OPERATOR_EARNINGS)).toBe("Fixed ₹400");
    expect(isFixedCadPayout(FALLBACK_CAD_OPERATOR_EARNINGS)).toBe(true);
  });
});

describe("mapLedgerSettlement", () => {
  it("prefers FIXED settlement components over payoutPercent", () => {
    const s = mapLedgerSettlement({
      pricingRuleVersion: "CAD_PAYOUT_V1_FIXED_400",
      payoutModel: "FIXED",
      grossPricePaise: 50000,
      bookingPaise: 10000,
      balancePaise: 40000,
      payoutPaise: 40000,
      platformFeePaise: 10000,
      payoutPercent: 20,
    });
    expect(s.payoutModel).toBe("FIXED");
    expect(s.payoutRupees).toBe(400);
    expect(s.bookingRupees).toBe(100);
    expect(s.platformFeeRupees).toBe(100);
    expect(s.pricingRuleVersion).toBe("CAD_PAYOUT_V1_FIXED_400");
  });

  it("resolveLedgerPayoutRupees prefers payoutPaise", () => {
    expect(
      resolveLedgerPayoutRupees({
        payoutPaise: 40000,
        amountRupees: 100,
        payoutPercent: 20,
      })
    ).toBe(400);
  });
});

describe("normalizePublicBusinessRules", () => {
  it("unwraps envelope", () => {
    const rules = normalizePublicBusinessRules({
      success: true,
      data: {
        cadOperatorEarnings: {
          model: "FIXED",
          payoutRupees: 400,
          standardOrderGrossRupees: 500,
          bookingRupees: 100,
          balanceRupees: 400,
          percent: null,
          ruleVersion: "CAD_PAYOUT_V1_FIXED_400",
        },
      },
    });
    expect(rules.cadOperatorEarnings.payoutRupees).toBe(400);
    expect(rules.cadOperatorEarnings.model).toBe("FIXED");
  });
});
