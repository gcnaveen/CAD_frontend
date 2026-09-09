import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  extractAccessToken,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getStoredAccessToken,
  storeAccessToken,
  clearLegacyAuthStorage,
  isUsableTabUser,
  TOKEN_KEY,
  USER_KEY,
} from "./authToken.js";

describe("extractAccessToken", () => {
  it("reads accessToken", () => {
    expect(extractAccessToken({ accessToken: " abc " })).toBe("abc");
  });

  it("reads access_token and nested data", () => {
    expect(extractAccessToken({ access_token: "a" })).toBe("a");
    expect(extractAccessToken({ data: { accessToken: "nested" } })).toBe(
      "nested"
    );
  });

  it("falls back to legacy token", () => {
    expect(extractAccessToken({ token: "legacy" })).toBe("legacy");
  });

  it("prefers accessToken over token", () => {
    expect(
      extractAccessToken({ accessToken: "new", token: "old" })
    ).toBe("new");
  });
});

describe("in-memory setAccessToken / getAccessToken / clearAccessToken", () => {
  beforeEach(() => {
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("stores and reads trimmed token", () => {
    setAccessToken("  jwt-value  ");
    expect(getAccessToken()).toBe("jwt-value");
  });

  it("clearAccessToken clears memory", () => {
    setAccessToken("jwt-value");
    clearAccessToken();
    expect(getAccessToken()).toBe(null);
  });

  it("deprecated aliases use the same memory store", () => {
    storeAccessToken("  alias-jwt  ");
    expect(getStoredAccessToken()).toBe("alias-jwt");
    clearAccessToken();
    expect(getStoredAccessToken()).toBe(null);
  });

  it("does not write the access token to localStorage", () => {
    setAccessToken("memory-only");
    expect(localStorage.getItem(TOKEN_KEY)).toBe(null);
    expect(localStorage.getItem(USER_KEY)).toBe(null);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe(null);
    expect(localStorage.getItem("persist:auth")).toBe(null);
  });

  it("isUsableTabUser accepts id, userId, role, or auth.phone", () => {
    expect(isUsableTabUser({ role: "SURVEYOR" })).toBe(true);
    expect(isUsableTabUser({ userId: "abc" })).toBe(true);
    expect(isUsableTabUser({ auth: { phone: "7676561769" } })).toBe(true);
    expect(isUsableTabUser({ name: "Only name" })).toBe(false);
  });

  it("clearLegacyAuthStorage removes legacy token/user/persist keys", () => {
    localStorage.setItem(TOKEN_KEY, "stale-jwt");
    localStorage.setItem(USER_KEY, JSON.stringify({ role: "ADMIN" }));
    localStorage.setItem("persist:auth", "{}");
    localStorage.setItem("userName", "Old");
    sessionStorage.setItem(TOKEN_KEY, "sess-jwt");

    clearLegacyAuthStorage();

    expect(localStorage.getItem(TOKEN_KEY)).toBe(null);
    expect(localStorage.getItem(USER_KEY)).toBe(null);
    expect(localStorage.getItem("persist:auth")).toBe(null);
    expect(localStorage.getItem("userName")).toBe(null);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe(null);
  });
});
