import { describe, expect, it } from "vitest";
import {
  computeSketchTierPayable,
  sketchTierBreakdownParts,
  feePaiseToRupees,
  computeSketchSubmitAmountRupees,
  buildSketchCheckoutBreakdown,
  normalizeSurveyorSketchPricingPayload,
  GOOGLE_SUPERIMPOSE_CHARGE,
  GST_RATE,
  FALLBACK_SURVEYOR_SKETCH_PRICING,
} from "./sketchPricingCompute.js";

describe("computeSketchTierPayable", () => {
  it("uses plan − discount when plan > 0", () => {
    expect(
      computeSketchTierPayable({
        planAmountRupees: 500,
        discountRupees: 100,
        feePaise: 99999,
      })
    ).toBe(400);
  });

  it("floors discount at zero", () => {
    expect(
      computeSketchTierPayable({
        planAmountRupees: 100,
        discountRupees: 250,
      })
    ).toBe(0);
  });

  it("falls back to feePaise / 100 when plan is 0", () => {
    expect(
      computeSketchTierPayable({
        planAmountRupees: 0,
        discountRupees: 0,
        feePaise: 150,
      })
    ).toBe(1.5);
  });

  it("prefers explicit payableRupees from API", () => {
    expect(
      computeSketchTierPayable({
        payableRupees: 42,
        planAmountRupees: 500,
        discountRupees: 0,
      })
    ).toBe(42);
  });

  it("returns 0 for null/invalid tier", () => {
    expect(computeSketchTierPayable(null)).toBe(0);
    expect(computeSketchTierPayable(undefined)).toBe(0);
  });
});

describe("sketchTierBreakdownParts", () => {
  it("shows plan and applied discount", () => {
    expect(
      sketchTierBreakdownParts({
        planAmountRupees: 200,
        discountRupees: 50,
        feePaise: 0,
      })
    ).toEqual({
      baseDisplayRupees: 200,
      discountDisplayRupees: 50,
      afterDiscountRupees: 150,
    });
  });

  it("uses fee when no plan", () => {
    expect(
      sketchTierBreakdownParts({
        planAmountRupees: 0,
        discountRupees: 10,
        feePaise: 40000,
      })
    ).toEqual({
      baseDisplayRupees: 400,
      discountDisplayRupees: 0,
      afterDiscountRupees: 400,
    });
  });
});

describe("feePaiseToRupees", () => {
  it("converts paise to rupees", () => {
    expect(feePaiseToRupees(40000)).toBe(400);
    expect(feePaiseToRupees(-100)).toBe(0);
  });
});

describe("checkout amounts", () => {
  const upload = { planAmountRupees: 100, discountRupees: 0, feePaise: 0 };
  const revision = { planAmountRupees: 50, discountRupees: 10, feePaise: 0 };

  it("adds GST on upload tier", () => {
    const base = 100;
    const expected = base + base * GST_RATE;
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: false,
      })
    ).toBeCloseTo(expected);
  });

  it("adds Google superimpose + GST", () => {
    const base = 100 + GOOGLE_SUPERIMPOSE_CHARGE;
    const expected = base + base * GST_RATE;
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: true,
      })
    ).toBeCloseTo(expected);
  });

  it("uses revision tier when isRevision", () => {
    const base = 40;
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: true,
        isGoogleSuperimpose: false,
      })
    ).toBeCloseTo(base + base * GST_RATE);
  });

  it("buildSketchCheckoutBreakdown matches submit amount", () => {
    const breakdown = buildSketchCheckoutBreakdown({
      upload,
      revision,
      isRevision: false,
      isGoogleSuperimpose: true,
    });
    expect(breakdown.googleFeeRupees).toBe(GOOGLE_SUPERIMPOSE_CHARGE);
    expect(breakdown.finalPayableRupees).toBeCloseTo(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: true,
      })
    );
  });
});

describe("normalizeSurveyorSketchPricingPayload", () => {
  it("coerces nested upload/revision/balance", () => {
    const out = normalizeSurveyorSketchPricingPayload({
      data: {
        upload: { planAmountRupees: 200, discountRupees: 20, feePaise: 1 },
        revision: { planAmountPaise: 5000, discountPaise: 1000 },
        balance: { feePaise: 40000 },
      },
    });
    expect(out.upload.planAmountRupees).toBe(200);
    expect(out.upload.discountRupees).toBe(20);
    expect(out.revision.planAmountRupees).toBe(50);
    expect(out.revision.discountRupees).toBe(10);
    expect(out.balance.feePaise).toBe(40000);
  });

  it("falls back when payload empty", () => {
    const out = normalizeSurveyorSketchPricingPayload({});
    expect(out.upload.feePaise).toBe(FALLBACK_SURVEYOR_SKETCH_PRICING.upload.feePaise);
    expect(out.revision.feePaise).toBe(FALLBACK_SURVEYOR_SKETCH_PRICING.revision.feePaise);
    expect(out.balance.feePaise).toBe(FALLBACK_SURVEYOR_SKETCH_PRICING.balance.feePaise);
  });
});
