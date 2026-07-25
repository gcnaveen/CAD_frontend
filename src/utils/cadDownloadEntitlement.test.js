import { describe, expect, it } from "vitest";
import {
  getDownloadEntitlement,
  isCadDownloadEntitled,
  formatBalancePayableRupees,
  getCadDownloadUiAction,
  normalizeCadDeliverableMeta,
  cadDownloadDenialMessage,
} from "./cadDownloadEntitlement.js";

describe("entitlement flags", () => {
  it("reads entitlement object and granted flag", () => {
    expect(getDownloadEntitlement({})).toBeNull();
    expect(
      getDownloadEntitlement({ downloadEntitlement: { granted: true } })
    ).toEqual({ granted: true });
    expect(isCadDownloadEntitled({ downloadEntitlement: { granted: true } })).toBe(
      true
    );
    expect(isCadDownloadEntitled({ downloadEntitlement: { granted: false } })).toBe(
      false
    );
  });
});

describe("formatBalancePayableRupees", () => {
  it("prefers entitlement payable, then paise, then balancePayment, then fallback", () => {
    expect(
      formatBalancePayableRupees({
        downloadEntitlement: { payableRupees: 350 },
      })
    ).toBe(350);
    expect(
      formatBalancePayableRupees({
        downloadEntitlement: { amountPaise: 25000 },
      })
    ).toBe(250);
    expect(
      formatBalancePayableRupees({
        balancePayment: { payableRupees: 400 },
      })
    ).toBe(400);
    expect(formatBalancePayableRupees({})).toBe(400);
    expect(formatBalancePayableRupees({}, 199)).toBe(199);
  });
});

describe("getCadDownloadUiAction", () => {
  it("hides when not delivered and no deliverable meta", () => {
    expect(getCadDownloadUiAction({ status: "SUBMITTED" })).toBe("hidden");
  });

  it("returns download when entitlement granted", () => {
    expect(
      getCadDownloadUiAction({
        status: "CAD_DELIVERED",
        cadDeliverable: [{ fileName: "a.dwg", url: "https://x" }],
        downloadEntitlement: { granted: true },
      })
    ).toBe("download");
  });

  it("returns pay when balance payment required", () => {
    expect(
      getCadDownloadUiAction({
        status: "CAD_DELIVERED",
        cadDeliverable: [{ fileName: "a.dwg", urlWithheld: true }],
        downloadEntitlement: {
          granted: false,
          reason: "BALANCE_PAYMENT_REQUIRED",
        },
      })
    ).toBe("pay");
  });

  it("returns pending / refunded for those reasons", () => {
    expect(
      getCadDownloadUiAction({
        status: "CAD_DELIVERED",
        cadDeliverable: [{ fileName: "a.dwg" }],
        downloadEntitlement: {
          granted: false,
          reason: "BALANCE_PAYMENT_PENDING",
        },
      })
    ).toBe("pending");
    expect(
      getCadDownloadUiAction({
        status: "CAD_DELIVERED",
        cadDeliverable: [{ fileName: "a.dwg" }],
        downloadEntitlement: { granted: false, reason: "REFUNDED" },
      })
    ).toBe("refunded");
  });

  it("legacy payload without entitlement: withheld url → pay", () => {
    expect(
      getCadDownloadUiAction({
        status: "CAD_DELIVERED",
        cadDeliverable: [{ fileName: "a.dwg", urlWithheld: true }],
      })
    ).toBe("pay");
  });
});

describe("normalizeCadDeliverableMeta", () => {
  it("normalizes array and strips withheld urls", () => {
    const out = normalizeCadDeliverableMeta([
      { fileName: "a.dwg", url: "https://secret", urlWithheld: true },
      { name: "b.dwg", url: "https://ok" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].urlWithheld).toBe(true);
    expect(out[0].url).toBeUndefined();
    expect(out[1].url).toBe("https://ok");
    expect(out[1].fileName).toBe("b.dwg");
  });
});

describe("cadDownloadDenialMessage", () => {
  it("maps known denial codes", () => {
    expect(cadDownloadDenialMessage("BALANCE_PAYMENT_REQUIRED")).toMatch(/Pay the balance/i);
    expect(cadDownloadDenialMessage("AMOUNT_MISMATCH")).toMatch(/did not match/i);
    expect(cadDownloadDenialMessage("UNKNOWN")).toMatch(/Unable to download/i);
  });
});
