import { describe, expect, it } from "vitest";
import {
  getRedirectForRole,
  isAuthOnlyPath,
  AUTH_ONLY_PATHS,
} from "./authRedirect.js";
import { normalizeRoleKey, ROLES } from "../constants/roles.js";
import { normalizeAdminSketchPricingRecord } from "../services/admin/sketchPricingAdminService.js";

describe("getRedirectForRole", () => {
  it("routes admin / cad / surveyor roles", () => {
    expect(getRedirectForRole("SUPER_ADMIN")).toBe("/superadmin");
    expect(getRedirectForRole("ADMIN")).toBe("/superadmin");
    expect(getRedirectForRole("CAD")).toBe("/dashboard/cad");
    expect(getRedirectForRole("CAD_USER")).toBe("/dashboard/cad");
    expect(getRedirectForRole("SURVEYOR")).toBe("/dashboard/user");
    expect(getRedirectForRole("USER")).toBe("/dashboard/user");
    expect(getRedirectForRole(null)).toBe("/");
  });
});

describe("isAuthOnlyPath", () => {
  it("marks login/register paths", () => {
    expect(isAuthOnlyPath("/login")).toBe(true);
    expect(isAuthOnlyPath("/register")).toBe(true);
    expect(AUTH_ONLY_PATHS.has("/login-email")).toBe(true);
    expect(AUTH_ONLY_PATHS.has("/enroll")).toBe(true);
    expect(isAuthOnlyPath("/dashboard/user")).toBe(false);
  });
});

describe("normalizeRoleKey", () => {
  it("normalizes spaced / lowercase roles", () => {
    expect(normalizeRoleKey("super admin")).toBe(ROLES.SUPER_ADMIN);
    expect(normalizeRoleKey("superadmin")).toBe(ROLES.SUPER_ADMIN);
    expect(normalizeRoleKey("surveyor")).toBe(ROLES.SURVEYOR);
  });
});

describe("normalizeAdminSketchPricingRecord", () => {
  it("coerces admin pricing fields to numbers", () => {
    const out = normalizeAdminSketchPricingRecord({
      data: {
        sketchUploadPlanAmountRupees: "100",
        sketchUploadDiscountRupees: "10",
        sketchRevisionPlanAmountRupees: 50,
        sketchRevisionDiscountRupees: 5,
        sketchBalancePlanAmountRupees: 400,
        sketchBalanceDiscountRupees: 0,
      },
    });
    expect(out.sketchUploadPlanAmountRupees).toBe(100);
    expect(out.sketchUploadDiscountRupees).toBe(10);
    expect(out.sketchBalancePlanAmountRupees).toBe(400);
  });
});
