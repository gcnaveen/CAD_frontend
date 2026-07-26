import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  TOKEN_KEY,
  extractAccessToken,
  getStoredAccessToken,
  storeAccessToken,
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

describe("getStoredAccessToken / storeAccessToken", () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
  });
  afterEach(() => {
    localStorage.removeItem(TOKEN_KEY);
  });

  it("stores and reads trimmed token", () => {
    storeAccessToken("  jwt-value  ");
    expect(getStoredAccessToken()).toBe("jwt-value");
  });
});
