import { describe, expect, it } from "vitest";
import {
  isIndexablePath,
  titleForPath,
  BRAND_NAME,
} from "./siteMeta.js";

describe("siteMeta indexing (L-01)", () => {
  it("indexes public marketing and auth entry paths", () => {
    expect(isIndexablePath("/")).toBe(true);
    expect(isIndexablePath("/login")).toBe(true);
    expect(isIndexablePath("/register/cad-operator")).toBe(true);
    expect(isIndexablePath("/privacy-policy")).toBe(true);
    expect(isIndexablePath("/terms-and-conditions")).toBe(true);
  });

  it("noindexes private app shells", () => {
    expect(isIndexablePath("/dashboard/user")).toBe(false);
    expect(isIndexablePath("/dashboard/cad/wallet")).toBe(false);
    expect(isIndexablePath("/superadmin")).toBe(false);
    expect(isIndexablePath("/superadmin/projects")).toBe(false);
    expect(isIndexablePath("/payment/return")).toBe(false);
    expect(isIndexablePath("/complete-profile")).toBe(false);
    expect(isIndexablePath("/403")).toBe(false);
  });

  it("uses North-cot titles for public pages", () => {
    expect(titleForPath("/")).toContain(BRAND_NAME);
    expect(titleForPath("/login")).toContain(BRAND_NAME);
    expect(titleForPath("/dashboard/user")).toBe(`${BRAND_NAME} App`);
  });
});
