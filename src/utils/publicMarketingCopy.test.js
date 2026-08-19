import { describe, expect, it } from "vitest";
import {
  SAFE_REFUND_FALLBACK,
  SAFE_REVISION_FALLBACK,
  applyCanonicalFaqAnswers,
  formatRevisionFeeLabel,
  revisionRupeesFromRules,
} from "./publicMarketingCopy.js";

describe("revisionRupeesFromRules", () => {
  it("returns null when no revision field exists (does not use booking ₹100)", () => {
    expect(
      revisionRupeesFromRules({
        cadOperatorEarnings: { bookingRupees: 100, balanceRupees: 400 },
        raw: { cadOperatorEarnings: { bookingRupees: 100 } },
      })
    ).toBeNull();
  });

  it("returns 0 when backend explicitly reports revisionPaise 0", () => {
    expect(revisionRupeesFromRules({ raw: { revisionPaise: 0 } })).toBe(0);
    expect(formatRevisionFeeLabel(0)).toBeNull();
  });

  it("reads payable rupees from pricing.revision when present", () => {
    expect(
      revisionRupeesFromRules({
        raw: { pricing: { revision: { payableRupees: 75 } } },
      })
    ).toBe(75);
    expect(formatRevisionFeeLabel(75)).toBe("₹75");
  });
});

describe("applyCanonicalFaqAnswers", () => {
  const items = [
    { question: "What is your refund policy?", answer: "Hardcoded refund." },
    { question: "What if I need revisions?", answer: "Hardcoded ₹100." },
    { question: "How long does delivery take?", answer: "48 hours." },
  ];

  it("uses backend refund summary when available", () => {
    const out = applyCanonicalFaqAnswers(items, {
      refundSummary: "Canonical refund from business-rules.",
    });
    expect(out[0].answer).toBe("Canonical refund from business-rules.");
    expect(out[2].answer).toBe("48 hours.");
  });

  it("uses safe refund fallback when API omitted the policy", () => {
    const out = applyCanonicalFaqAnswers(items, { refundSummary: null });
    expect(out[0].answer).toBe(SAFE_REFUND_FALLBACK);
  });

  it("does not keep hardcoded revision ₹100 when no authoritative fee", () => {
    const out = applyCanonicalFaqAnswers(items, { revisionFeeLabel: null });
    expect(out[1].answer).toBe(SAFE_REVISION_FALLBACK);
    expect(out[1].answer).not.toContain("₹100");
  });
});
