import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAccessToken, setAccessToken, clearAccessToken } from "../../utils/authToken.js";

/**
 * REG-01 — CAD resume upload must use the in-memory token (M-02),
 * not localStorage. Cadregisterform.jsx calls getAccessToken().
 */
describe("CAD resume upload auth (REG-01)", () => {
  beforeEach(() => {
    clearAccessToken();
    localStorage.clear();
  });
  afterEach(() => {
    clearAccessToken();
    localStorage.clear();
  });

  it("treats a memory token as signed-in even when localStorage is empty", () => {
    localStorage.setItem("token", "");
    setAccessToken("memory-jwt");
    expect(localStorage.getItem("token")).toBe("");
    expect(getAccessToken()).toBe("memory-jwt");
  });

  it("does not treat a leftover localStorage token as session auth", () => {
    localStorage.setItem("token", "stale-jwt");
    expect(getAccessToken()).toBe(null);
  });
});
