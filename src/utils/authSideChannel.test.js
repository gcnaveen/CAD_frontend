import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  captureAuthSideChannel,
  buildRefreshRequestBody,
  clearAuthSideChannel,
  shouldAttemptSessionRestore,
  getUserSnapshot,
  isAuthSideChannelUrl,
  REFRESH_BODY_SESSION_KEY,
  CSRF_SESSION_KEY,
} from "./authSideChannel.js";

const loginPayload = {
  success: true,
  data: {
    user: { id: "1", role: "SURVEYOR" },
    accessToken: "access-jwt",
    refreshToken: "body-refresh-secret",
    csrfToken: "csrf-from-login",
    authStorage: {
      accessToken: "memory",
      refreshToken: "httpOnlyCookie+bodyCompat",
      csrf: "cookie+header",
    },
  },
};

describe("authSideChannel", () => {
  beforeEach(() => {
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("captures csrf and body refresh from login JSON and never writes them to localStorage", () => {
    captureAuthSideChannel(loginPayload);
    expect(sessionStorage.getItem(CSRF_SESSION_KEY)).toBe("csrf-from-login");
    expect(sessionStorage.getItem(REFRESH_BODY_SESSION_KEY)).toBe(
      "body-refresh-secret"
    );
    expect(localStorage.getItem(REFRESH_BODY_SESSION_KEY)).toBe(null);
    expect(localStorage.getItem("refreshToken")).toBe(null);
    expect(shouldAttemptSessionRestore()).toBe(true);
    expect(buildRefreshRequestBody()).toEqual({
      refreshToken: "body-refresh-secret",
      csrfToken: "csrf-from-login",
    });
  });

  it("captures user snapshot from login so F5 can restore role", () => {
    captureAuthSideChannel(loginPayload);
    expect(getUserSnapshot()?.role).toBe("SURVEYOR");
    expect(localStorage.getItem("user")).toBe(null);
  });

  it("clears side-channel on logout", () => {
    captureAuthSideChannel(loginPayload);
    clearAuthSideChannel();
    expect(shouldAttemptSessionRestore()).toBe(false);
    expect(buildRefreshRequestBody()).toEqual({});
    expect(getUserSnapshot()).toBe(null);
  });

  // GET /api/users/:id also returns a `user`; capturing it would restore the
  // wrong role after F5 (an admin coming back as the surveyor they opened).
  it("only treats auth endpoints as side-channel sources", () => {
    expect(isAuthSideChannelUrl("/api/auth/login")).toBe(true);
    expect(isAuthSideChannelUrl("/api/auth/refresh")).toBe(true);
    expect(isAuthSideChannelUrl("/api/auth/me")).toBe(true);
    expect(isAuthSideChannelUrl("/api/users/69cd2246ab1a21640e882983")).toBe(
      false
    );
    expect(isAuthSideChannelUrl("/api/admin/users")).toBe(false);
    expect(isAuthSideChannelUrl(undefined)).toBe(false);
  });

  it("keeps the login snapshot when a non-auth user payload arrives", () => {
    captureAuthSideChannel(loginPayload);
    const otherUser = { success: true, data: { user: { id: "9", role: "CAD" } } };
    if (isAuthSideChannelUrl("/api/users/9")) {
      captureAuthSideChannel(otherUser);
    }
    expect(getUserSnapshot()?.role).toBe("SURVEYOR");
  });
});
