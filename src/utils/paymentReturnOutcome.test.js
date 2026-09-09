/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  normalizePaymentOutcome,
  PAYMENT_QUERY_KEY,
} from "./paymentReturnOutcome.js";

describe("normalizePaymentOutcome", () => {
  it("uses the query key the backend redirects with", () => {
    expect(PAYMENT_QUERY_KEY).toBe("payment");
  });

  it("returns null when the param is absent or blank", () => {
    expect(normalizePaymentOutcome(null)).toBe(null);
    expect(normalizePaymentOutcome(undefined)).toBe(null);
    expect(normalizePaymentOutcome("")).toBe(null);
    expect(normalizePaymentOutcome("   ")).toBe(null);
  });

  it.each(["success", "successful", "completed", "complete", "paid"])(
    "maps %s to success",
    (value) => {
      expect(normalizePaymentOutcome(value)).toBe("success");
    }
  );

  it.each([
    "cancelled",
    "canceled",
    "cancel",
    "failed",
    "failure",
    "fail",
    "declined",
    "error",
  ])("maps %s to failed", (value) => {
    expect(normalizePaymentOutcome(value)).toBe("failed");
  });

  it("is case and whitespace insensitive", () => {
    expect(normalizePaymentOutcome("CANCELLED")).toBe("failed");
    expect(normalizePaymentOutcome("  Success  ")).toBe("success");
  });

  it("falls back to unknown for values it does not recognise", () => {
    expect(normalizePaymentOutcome("pending")).toBe("unknown");
    expect(normalizePaymentOutcome("weird-value")).toBe("unknown");
  });
});
