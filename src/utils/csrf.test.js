import { describe, it, expect, afterEach, beforeEach } from "vitest";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  readCsrfTokenFromCookie,
  withCsrfHeaders,
} from "./csrf.js";
import { captureAuthSideChannel, clearAuthSideChannel } from "./authSideChannel.js";

describe("csrf helpers", () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")
    || Object.getOwnPropertyDescriptor(document, "cookie");

  beforeEach(() => {
    clearAuthSideChannel();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, "cookie", originalCookie);
    }
    clearAuthSideChannel();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("reads cad_csrf from cookie string", () => {
    expect(
      readCsrfTokenFromCookie(`${CSRF_COOKIE_NAME}=abc123; other=1`)
    ).toBe("abc123");
  });

  it("decodes URI-encoded cookie values", () => {
    expect(
      readCsrfTokenFromCookie(`${CSRF_COOKIE_NAME}=tok%2Fvalue`)
    ).toBe("tok/value");
  });

  it("returns null when missing", () => {
    expect(readCsrfTokenFromCookie("a=1; b=2")).toBeNull();
  });

  it("adds X-CSRF-Token header when document cookie has cad_csrf", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => `${CSRF_COOKIE_NAME}=csrf-test-token`,
    });
    expect(withCsrfHeaders({ "Content-Type": "application/json" })).toEqual({
      "Content-Type": "application/json",
      [CSRF_HEADER_NAME]: "csrf-test-token",
    });
  });

  it("omits CSRF header when cookie and stored token are absent", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
    });
    expect(withCsrfHeaders({ Accept: "application/json" })).toEqual({
      Accept: "application/json",
    });
  });

  it("adds X-CSRF-Token from login body when cookie is not readable", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
    });
    captureAuthSideChannel({ data: { csrfToken: "from-login" } });
    expect(withCsrfHeaders({})).toEqual({
      [CSRF_HEADER_NAME]: "from-login",
    });
  });
});
