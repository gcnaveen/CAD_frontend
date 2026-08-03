import { describe, it, expect } from "vitest";
import {
  getPaymentRedirectUrls,
  assertSafeCheckoutRedirect,
  isLocalhostPaymentUrl,
} from "./paymentRedirectUrls.js";

describe("paymentRedirectUrls", () => {
  it("detects localhost hosts", () => {
    expect(isLocalhostPaymentUrl("http://localhost:5173/payment-success")).toBe(true);
    expect(isLocalhostPaymentUrl("http://127.0.0.1:4173/payment-failure")).toBe(true);
    expect(isLocalhostPaymentUrl("https://north-cot.com/payment-success")).toBe(false);
  });

  it("allows non-localhost checkout URL in non-prod", () => {
    expect(
      assertSafeCheckoutRedirect("https://mercury-t2.phonepe.com/transact/xyz", {
        isProd: false,
      })
    ).toContain("phonepe.com");
  });

  it("allows localhost checkout only when not production", () => {
    expect(
      assertSafeCheckoutRedirect("http://localhost:5173/payment-success", {
        isProd: false,
      })
    ).toContain("localhost");
  });

  it("rejects localhost checkout in production", () => {
    expect(() =>
      assertSafeCheckoutRedirect("http://localhost:5173/payment-success", {
        isProd: true,
      })
    ).toThrow(/localhost payment URL/i);
  });

  it("rejects empty checkout URL", () => {
    expect(() => assertSafeCheckoutRedirect("", { isProd: false })).toThrow(
      /Missing payment checkout URL/
    );
  });

  it("requires payment env URLs in production", () => {
    expect(() =>
      getPaymentRedirectUrls({ isProd: true, successUrl: "", failureUrl: "" })
    ).toThrow(/VITE_PAYMENT_SUCCESS_URL/);
  });

  it("rejects localhost payment env URLs in production", () => {
    expect(() =>
      getPaymentRedirectUrls({
        isProd: true,
        successUrl: "http://localhost:5173/payment-success",
        failureUrl: "http://localhost:5173/payment-failure",
      })
    ).toThrow(/must not use localhost/);
  });

  it("accepts production absolute HTTPS return URLs", () => {
    expect(
      getPaymentRedirectUrls({
        isProd: true,
        successUrl: "https://north-cot.com/payment-success",
        failureUrl: "https://north-cot.com/payment-failure",
      })
    ).toEqual({
      successUrl: "https://north-cot.com/payment-success",
      failureUrl: "https://north-cot.com/payment-failure",
    });
  });
});
