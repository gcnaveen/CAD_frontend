import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canRetrySketchPayment,
  isSketchPaymentCompleted,
  isBalancePaymentCompleted,
  isCadBalancePaymentPurpose,
  resolveSketchPaymentUploadId,
  formatSketchPayableRupees,
  normalizeSketchPaymentPageState,
  saveSketchPaymentContext,
  readSketchPaymentContext,
  clearSketchPaymentContext,
  getPaymentCheckoutUrl,
} from "./sketchPaymentUtils.js";

describe("canRetrySketchPayment", () => {
  it("allows retry for PAYMENT_PENDING + FAILED/AMOUNT_MISMATCH/PENDING", () => {
    expect(
      canRetrySketchPayment({
        status: "PAYMENT_PENDING",
        sketchPayment: { status: "FAILED" },
      })
    ).toBe(true);
    expect(
      canRetrySketchPayment({
        status: "PAYMENT_PENDING",
        sketchPayment: { status: "AMOUNT_MISMATCH" },
      })
    ).toBe(true);
    expect(
      canRetrySketchPayment({
        status: "PAYMENT_PENDING",
        sketchPayment: { paymentStatus: "PENDING" },
      })
    ).toBe(true);
  });

  it("rejects when not payment-pending", () => {
    expect(
      canRetrySketchPayment({
        status: "SUBMITTED",
        sketchPayment: { status: "FAILED" },
      })
    ).toBe(false);
  });
});

describe("isSketchPaymentCompleted / isBalancePaymentCompleted", () => {
  it("detects sketch payment success statuses and paidAt", () => {
    expect(
      isSketchPaymentCompleted({ sketchPayment: { status: "COMPLETED" } })
    ).toBe(true);
    expect(
      isSketchPaymentCompleted({ sketchPayment: { status: "SUCCESS" } })
    ).toBe(true);
    expect(
      isSketchPaymentCompleted({ sketchPayment: { paidAt: "2026-01-01" } })
    ).toBe(true);
    expect(isSketchPaymentCompleted({ sketchPayment: { status: "PENDING" } })).toBe(
      false
    );
  });

  it("detects balance / entitlement grant", () => {
    expect(
      isBalancePaymentCompleted({ downloadEntitlement: { granted: true } })
    ).toBe(true);
    expect(
      isBalancePaymentCompleted({ balancePayment: { status: "PAID" } })
    ).toBe(true);
    expect(
      isBalancePaymentCompleted({
        downloadEntitlement: { balancePaymentStatus: "PENDING" },
      })
    ).toBe(false);
  });
});

describe("payment purpose + amount helpers", () => {
  beforeEach(() => {
    clearSketchPaymentContext();
  });
  afterEach(() => {
    clearSketchPaymentContext();
  });

  it("isCadBalancePaymentPurpose reads string or meta", () => {
    expect(isCadBalancePaymentPurpose("CAD_BALANCE")).toBe(true);
    expect(isCadBalancePaymentPurpose({ purpose: "CAD_BALANCE" })).toBe(true);
    expect(isCadBalancePaymentPurpose("SKETCH")).toBe(false);
  });

  it("resolves upload id from query, state, then localStorage", () => {
    const params = new URLSearchParams("uploadId=from-query");
    expect(resolveSketchPaymentUploadId(params, null)).toBe("from-query");
    expect(
      resolveSketchPaymentUploadId(new URLSearchParams(), { uploadId: "from-state" })
    ).toBe("from-state");
    saveSketchPaymentContext({ uploadId: "from-ls" });
    expect(resolveSketchPaymentUploadId(new URLSearchParams(), null)).toBe("from-ls");
  });

  it("formatSketchPayableRupees prefers meta, then sketch fields, then paise", () => {
    expect(formatSketchPayableRupees({}, { payableRupees: 12.5 })).toBe(12.5);
    expect(
      formatSketchPayableRupees({
        sketchPayment: { planAmountRupees: 100, discountRupees: 25 },
      })
    ).toBe(75);
    expect(
      formatSketchPayableRupees({ sketchPayment: { amountPaise: 15000 } })
    ).toBe(150);
  });

  it("getPaymentCheckoutUrl prefers checkoutPageUrl", () => {
    expect(
      getPaymentCheckoutUrl({
        checkoutPageUrl: " https://pay.example/checkout ",
        redirectUrl: "https://pay.example/redirect",
      })
    ).toBe("https://pay.example/checkout");
  });

  it("persists and clears payment context", () => {
    saveSketchPaymentContext({
      uploadId: "u1",
      merchantOrderId: "m1",
      amountPaise: 1000,
      purpose: "CAD_BALANCE",
    });
    expect(readSketchPaymentContext()?.uploadId).toBe("u1");
    expect(readSketchPaymentContext()?.purpose).toBe("CAD_BALANCE");
    clearSketchPaymentContext();
    expect(readSketchPaymentContext()).toBeNull();
  });
});

describe("normalizeSketchPaymentPageState", () => {
  it("maps sketch payment completed → success", () => {
    expect(
      normalizeSketchPaymentPageState({
        sketchPayment: { status: "COMPLETED" },
      })
    ).toBe("success");
  });

  it("maps PAYMENT_PENDING + AMOUNT_MISMATCH → failed (client amount reject)", () => {
    expect(
      normalizeSketchPaymentPageState({
        status: "PAYMENT_PENDING",
        sketchPayment: { status: "AMOUNT_MISMATCH" },
      })
    ).toBe("failed");
  });

  it("maps CAD balance pending / failed / success", () => {
    expect(
      normalizeSketchPaymentPageState(
        { downloadEntitlement: { granted: true } },
        "CAD_BALANCE"
      )
    ).toBe("success");
    expect(
      normalizeSketchPaymentPageState(
        { balancePayment: { status: "FAILED" } },
        "CAD_BALANCE"
      )
    ).toBe("failed");
    expect(
      normalizeSketchPaymentPageState(
        { balancePayment: { status: "PENDING" } },
        "CAD_BALANCE"
      )
    ).toBe("pending");
  });
});

describe("redirectToSketchCheckout", () => {
  it("returns false when checkout URL missing", async () => {
    const { redirectToSketchCheckout } = await import("./sketchPaymentUtils.js");
    expect(redirectToSketchCheckout({}, "u1")).toBe(false);
  });

  it("assigns window.location when checkout URL present", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, href: "http://localhost/" });
    const { redirectToSketchCheckout } = await import("./sketchPaymentUtils.js");
    const ok = redirectToSketchCheckout(
      { checkoutPageUrl: "https://pay.example/x", amountPaise: 100 },
      "u1"
    );
    expect(ok).toBe(true);
    expect(assign).toHaveBeenCalledWith("https://pay.example/x");
    vi.unstubAllGlobals();
  });
});
