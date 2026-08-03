import { describe, expect, it } from "vitest";
import {
  computeSketchTierPayable,
  sketchTierBreakdownParts,
  feePaiseToRupees,
  computeSketchSubmitAmountRupees,
  buildSketchCheckoutBreakdown,
  normalizeSurveyorSketchPricingPayload,
  getSuperimposeAddOnRupees,
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
        feePaise: 10000,
      })
    ).toBe(100);
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

describe("getSuperimposeAddOnRupees", () => {
  it("returns 0 when server omits add-on", () => {
    expect(getSuperimposeAddOnRupees({})).toBe(0);
    expect(getSuperimposeAddOnRupees(null)).toBe(0);
  });

  it("reads payableRupees / feePaise / amountRupees from common shapes", () => {
    expect(getSuperimposeAddOnRupees({ superimpose: { payableRupees: 150 } })).toBe(150);
    expect(getSuperimposeAddOnRupees({ googleSuperimpose: { feePaise: 20000 } })).toBe(200);
    expect(getSuperimposeAddOnRupees({ addons: { superimpose: { amountRupees: 75 } } })).toBe(75);
    expect(getSuperimposeAddOnRupees({ superimposeAddOnRupees: 90 })).toBe(90);
  });

  it("derives add-on from uploadWithSuperimpose minus upload", () => {
    expect(
      getSuperimposeAddOnRupees({
        upload: { payableRupees: 100 },
        uploadWithSuperimpose: { payableRupees: 300 },
      })
    ).toBe(200);
  });
});

describe("checkout amounts", () => {
  const upload = { planAmountRupees: 100, discountRupees: 0, feePaise: 0, payableRupees: 100 };
  const revision = { planAmountRupees: 50, discountRupees: 10, feePaise: 0, payableRupees: 40 };
  const superimposeAddOnRupees = 150;

  it("uses backend payable without inventing GST", () => {
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: false,
      })
    ).toBe(100);
  });

  it("adds server superimpose add-on only (no invented GST)", () => {
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: true,
        superimposeAddOnRupees,
      })
    ).toBe(100 + superimposeAddOnRupees);
  });

  it("charges 0 superimpose add-on when server omits it", () => {
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: true,
      })
    ).toBe(100);
  });

  it("uses revision tier when isRevision", () => {
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: true,
        isGoogleSuperimpose: false,
      })
    ).toBe(40);
  });

  it("adds API-provided gstAmountRupees when present", () => {
    expect(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: false,
        gstAmountRupees: 18,
      })
    ).toBe(118);
  });

  it("buildSketchCheckoutBreakdown matches submit amount", () => {
    const breakdown = buildSketchCheckoutBreakdown({
      upload,
      revision,
      isRevision: false,
      isGoogleSuperimpose: true,
      superimposeAddOnRupees,
    });
    expect(breakdown.googleFeeRupees).toBe(superimposeAddOnRupees);
    expect(breakdown.gstAmountRupees).toBe(0);
    expect(breakdown.finalPayableRupees).toBe(
      computeSketchSubmitAmountRupees({
        uploadTier: upload,
        revisionTier: revision,
        isRevision: false,
        isGoogleSuperimpose: true,
        superimposeAddOnRupees,
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
    expect(out.superimposeAddOnRupees).toBe(0);
  });

  it("extracts superimposeAddOnRupees from API add-ons", () => {
    const out = normalizeSurveyorSketchPricingPayload({
      data: {
        upload: { feePaise: 10000, payableRupees: 100 },
        revision: { feePaise: 10000, payableRupees: 100 },
        balance: { feePaise: 40000, payableRupees: 400 },
        googleSuperimpose: { payableRupees: 175 },
      },
    });
    expect(out.superimposeAddOnRupees).toBe(175);
  });

  it("preserves payableRupees and source from env-resolved upload", () => {
    const out = normalizeSurveyorSketchPricingPayload({
      data: {
        upload: {
          feePaise: 10000,
          payableRupees: 100,
          planAmountRupees: null,
          discountRupees: null,
          source: "env",
        },
        revision: {
          feePaise: 10000,
          payableRupees: 100,
          source: "env",
        },
        balance: { feePaise: 40000, payableRupees: 400, source: "env" },
      },
    });
    expect(out.upload.payableRupees).toBe(100);
    expect(out.upload.feePaise).toBe(10000);
    expect(out.upload.source).toBe("env");
    expect(computeSketchTierPayable(out.upload)).toBe(100);
  });
});
