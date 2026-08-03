import { describe, it, expect } from "vitest";
import { filterCadRoleUsers } from "../services/assignmentApi.js";
import { normalizeRoleKey, ROLES } from "../constants/roles.js";
import { getRedirectForRole } from "./authRedirect.js";

describe("CAD role case mismatch (ADMIN-12 / NEW-03)", () => {
  it("normalizeRoleKey handles cad casing variants", () => {
    expect(normalizeRoleKey("cad")).toBe(ROLES.CAD);
    expect(normalizeRoleKey("Cad")).toBe(ROLES.CAD);
    expect(normalizeRoleKey("CAD")).toBe(ROLES.CAD);
    expect(normalizeRoleKey("cad_user")).toBe(ROLES.CAD_USER);
    expect(normalizeRoleKey("CAD User")).toBe(ROLES.CAD_USER);
  });

  it("getRedirectForRole accepts mixed-case CAD roles", () => {
    expect(getRedirectForRole("cad")).toBe("/dashboard/cad");
    expect(getRedirectForRole("Cad")).toBe("/dashboard/cad");
    expect(getRedirectForRole("CAD_USER")).toBe("/dashboard/cad");
    expect(getRedirectForRole("cad user")).toBe("/dashboard/cad");
  });

  it("filterCadRoleUsers keeps CAD and CAD_USER regardless of casing", () => {
    const users = [
      { id: "1", role: "cad", name: { first: "A" } },
      { id: "2", role: "Cad", name: { first: "B" } },
      { id: "3", role: "CAD", name: { first: "C" } },
      { id: "4", role: "CAD_USER", name: { first: "D" } },
      { id: "5", role: "cad_user", name: { first: "E" } },
      { id: "6", role: "ADMIN", name: { first: "F" } },
      { id: "7", role: "SURVEYOR", name: { first: "G" } },
    ];
    const filtered = filterCadRoleUsers(users);
    expect(filtered.map((u) => u.id)).toEqual(["1", "2", "3", "4", "5"]);
  });
});
