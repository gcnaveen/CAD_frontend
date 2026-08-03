import { describe, expect, it } from "vitest";
import {
  canAdminApproveSketch,
  canAdminRejectSketch,
  REVIEW_APPROVE_FROM,
  REVIEW_REJECT_FROM,
} from "./sketchReviewAdminService.js";

describe("sketchReviewAdminService (BIZ-10)", () => {
  it("exposes approve/reject lifecycle allow-lists", () => {
    expect(REVIEW_APPROVE_FROM).toEqual(["CAD_DELIVERED"]);
    expect(REVIEW_REJECT_FROM).toContain("PAYMENT_PENDING");
    expect(REVIEW_REJECT_FROM).toContain("CAD_DELIVERED");
  });

  it("allows APPROVED only from CAD_DELIVERED when booking paid", () => {
    expect(
      canAdminApproveSketch({
        status: "CAD_DELIVERED",
        sketchPayment: { amountPaise: 1000, status: "COMPLETED" },
      })
    ).toBe(true);
    expect(
      canAdminApproveSketch({
        status: "CAD_DELIVERED",
        sketchPayment: { amountPaise: 1000, status: "PENDING" },
      })
    ).toBe(false);
    expect(
      canAdminApproveSketch({
        status: "ASSIGNED",
        sketchPayment: { amountPaise: 1000, status: "COMPLETED" },
      })
    ).toBe(false);
  });

  it("allows REJECTED from unpaid and mid-flow statuses", () => {
    expect(canAdminRejectSketch({ status: "PAYMENT_PENDING" })).toBe(true);
    expect(canAdminRejectSketch({ status: "PENDING" })).toBe(true);
    expect(canAdminRejectSketch({ status: "ASSIGNED" })).toBe(true);
    expect(canAdminRejectSketch({ status: "UNDER_REVISION" })).toBe(true);
    expect(canAdminRejectSketch({ status: "CAD_DELIVERED" })).toBe(true);
    expect(canAdminRejectSketch({ status: "APPROVED" })).toBe(false);
  });
});
