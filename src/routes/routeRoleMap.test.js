/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  ROUTE_ROLES,
  rolesForPath,
  isRoleAllowedForPath,
} from "./routeRoleMap.js";
import matrix from "../../docs/ROUTE_ROLE_MATRIX_M03.json";

describe("routeRoleMap (M-03)", () => {
  it("stays in sync with ROUTE_ROLE_MATRIX_M03.json", () => {
    expect(ROUTE_ROLES).toEqual(matrix.routes);
  });

  it("uses longest prefix match", () => {
    expect(rolesForPath("/superadmin")).toEqual(["SUPER_ADMIN", "ADMIN"]);
    expect(rolesForPath("/superadmin/home")).toEqual(["SUPER_ADMIN", "ADMIN"]);
    expect(rolesForPath("/dashboard/cad/wallet")).toEqual(["CAD", "CAD_USER"]);
    expect(rolesForPath("/dashboard/user/requests")).toEqual([
      "SURVEYOR",
      "USER",
      "CUSTOMER",
    ]);
    expect(rolesForPath("/complete-profile")).toEqual(["CAD", "CAD_USER"]);
  });

  it("returns null for unscoped authenticated paths", () => {
    expect(rolesForPath("/profile")).toBeNull();
    expect(rolesForPath("/payment-success")).toBeNull();
    expect(rolesForPath("/login")).toBeNull();
  });

  it("blocks cross-role shells", () => {
    expect(isRoleAllowedForPath("/superadmin", "CAD")).toBe(false);
    expect(isRoleAllowedForPath("/superadmin", "SURVEYOR")).toBe(false);
    expect(isRoleAllowedForPath("/dashboard/cad", "ADMIN")).toBe(false);
    expect(isRoleAllowedForPath("/dashboard/user", "CAD")).toBe(false);
    expect(isRoleAllowedForPath("/superadmin", "ADMIN")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/cad", "CAD")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/user", "SURVEYOR")).toBe(true);
  });

  it("normalizes role casing", () => {
    expect(isRoleAllowedForPath("/superadmin", "super_admin")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/cad", "cad_user")).toBe(true);
  });
});
