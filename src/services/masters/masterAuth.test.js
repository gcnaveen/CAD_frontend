import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  handleMasterWriteError,
  masterWriteAuthConfig,
} from "./masterAuth.js";

vi.mock("../../utils/authToken.js", () => ({
  getStoredAccessToken: vi.fn(),
}));

import { getStoredAccessToken } from "../../utils/authToken.js";

describe("masterWriteAuthConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Bearer Authorization when access token is present", () => {
    getStoredAccessToken.mockReturnValue("access-token-xyz");
    expect(masterWriteAuthConfig()).toEqual({
      headers: { Authorization: "Bearer access-token-xyz" },
    });
  });

  it("throws a session-expired message when no token", () => {
    getStoredAccessToken.mockReturnValue(null);
    expect(() => masterWriteAuthConfig()).toThrow(
      "Your session expired. Please sign in again."
    );
  });
});

describe("handleMasterWriteError", () => {
  it("maps 401 to session expired", () => {
    expect(() =>
      handleMasterWriteError(
        { response: { status: 401, data: {} } },
        "Failed"
      )
    ).toThrow("Your session expired. Please sign in again.");
  });

  it("maps 403 to insufficient permissions", () => {
    expect(() =>
      handleMasterWriteError(
        { response: { status: 403, data: {} } },
        "Failed"
      )
    ).toThrow(/Insufficient permissions/);
  });

  it("prefers API message when present", () => {
    expect(() =>
      handleMasterWriteError(
        {
          response: {
            status: 403,
            data: { message: "Insufficient permissions" },
          },
        },
        "Failed"
      )
    ).toThrow("Insufficient permissions");
  });
});
