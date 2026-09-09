import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../services/apiClient.js", () => ({
  beginAuthBootstrap: vi.fn(),
  endAuthBootstrap: vi.fn(),
}));

vi.mock("../../services/auth/authService.js", () => ({
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

import {
  restoreSession,
  startSessionRestore,
  resetSessionRestoreForTests,
} from "./sessionRestore.js";
import authReducer, { setCredentials, setBootstrapped } from "./authSlice.js";
import {
  getCurrentUser,
  refreshAccessToken,
} from "../../services/auth/authService.js";
import { beginAuthBootstrap, endAuthBootstrap } from "../../services/apiClient.js";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../../utils/authToken.js";
import {
  clearAuthSideChannel,
  markSessionHint,
  setUserSnapshot,
} from "../../utils/authSideChannel.js";

const NEW_TOKEN = "jwt-after-refresh";

/** Every role that can hold a session (src/constants/roles.js). */
const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CAD",
  "CAD_USER",
  "SURVEYOR",
  "USER",
  "CUSTOMER",
];

function recordingDispatch() {
  const actions = [];
  const dispatch = (action) => {
    actions.push(action);
    return action;
  };
  dispatch.actions = actions;
  return dispatch;
}

/** Replay through the real reducer: role normalization lives there. */
function reduce(dispatch) {
  return dispatch.actions.reduce(
    (state, action) => authReducer(state, action),
    authReducer(undefined, { type: "@@INIT" })
  );
}

function userFor(role, overrides = {}) {
  return {
    id: `user-${String(role).toLowerCase()}`,
    role,
    profileCompleted: true,
    name: { first: "Test", last: "User" },
    ...overrides,
  };
}

describe("restoreSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSessionRestoreForTests();
    clearAccessToken();
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    clearAccessToken();
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("always marks the session bootstrapped, even with nothing to restore", async () => {
    const dispatch = recordingDispatch();
    await restoreSession(dispatch);

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(dispatch.actions).toContainEqual(setBootstrapped(true));
    expect(reduce(dispatch).bootstrapped).toBe(true);
    expect(beginAuthBootstrap).toHaveBeenCalledTimes(1);
    expect(endAuthBootstrap).toHaveBeenCalledTimes(1);
  });

  describe.each(ALL_ROLES)("role %s", (role) => {
    it("restores the role from /api/auth/me after refresh", async () => {
      markSessionHint();
      refreshAccessToken.mockResolvedValue(NEW_TOKEN);
      getCurrentUser.mockResolvedValue({ user: userFor(role), role });

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      const state = reduce(dispatch);
      expect(state.role).toBe(role);
      expect(state.token).toBe(NEW_TOKEN);
      expect(state.bootstrapped).toBe(true);
      expect(getAccessToken()).toBe(NEW_TOKEN);
    });

    it("restores the role from the login snapshot when /api/auth/me fails", async () => {
      markSessionHint();
      setUserSnapshot(userFor(role));
      refreshAccessToken.mockResolvedValue(NEW_TOKEN);
      getCurrentUser.mockRejectedValue(new Error("me unavailable"));

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      const state = reduce(dispatch);
      expect(state.role).toBe(role);
      expect(state.token).toBe(NEW_TOKEN);
      expect(state.bootstrapped).toBe(true);
    });

    it("skips refresh when a live access token already resolves /api/auth/me", async () => {
      setAccessToken("live-token");
      getCurrentUser.mockResolvedValue({ user: userFor(role), role });

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      expect(refreshAccessToken).not.toHaveBeenCalled();
      const state = reduce(dispatch);
      expect(state.role).toBe(role);
      expect(state.token).toBe("live-token");
    });
  });

  // Backend and older sessions send mixed casing; ProtectedRoute compares keys.
  describe.each([
    ["cad", "CAD"],
    ["Cad", "CAD"],
    ["cad_user", "CAD_USER"],
    ["surveyor", "SURVEYOR"],
    ["super_admin", "SUPER_ADMIN"],
    ["superadmin", "SUPER_ADMIN"],
  ])("role casing %s", (raw, expected) => {
    it(`normalizes to ${expected}`, async () => {
      markSessionHint();
      refreshAccessToken.mockResolvedValue(NEW_TOKEN);
      getCurrentUser.mockResolvedValue({ user: userFor(raw), role: raw });

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      expect(reduce(dispatch).role).toBe(expected);
    });
  });

  // useProfileGuard sends CAD to /complete-profile on a falsy flag, so losing
  // it during restore would trap every CAD operator in the profile wizard.
  describe.each([true, false])("CAD profileCompleted=%s", (profileCompleted) => {
    it("survives restore through /api/auth/me", async () => {
      markSessionHint();
      refreshAccessToken.mockResolvedValue(NEW_TOKEN);
      getCurrentUser.mockResolvedValue({
        user: userFor("CAD", { profileCompleted }),
        role: "CAD",
      });

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      expect(reduce(dispatch).user.profileCompleted).toBe(profileCompleted);
    });

    it("survives restore through the login snapshot", async () => {
      markSessionHint();
      setUserSnapshot(userFor("CAD", { profileCompleted }));
      refreshAccessToken.mockResolvedValue(NEW_TOKEN);
      getCurrentUser.mockRejectedValue(new Error("me unavailable"));

      const dispatch = recordingDispatch();
      await restoreSession(dispatch);

      expect(reduce(dispatch).user.profileCompleted).toBe(profileCompleted);
    });
  });

  it("keeps the role when /api/auth/me returns it only at the top level", async () => {
    markSessionHint();
    refreshAccessToken.mockResolvedValue(NEW_TOKEN);
    getCurrentUser.mockResolvedValue({
      user: { id: "u-1", role: null },
      role: "ADMIN",
    });

    const dispatch = recordingDispatch();
    await restoreSession(dispatch);

    expect(reduce(dispatch).role).toBe("ADMIN");
  });

  it("stays anonymous but bootstrapped when refresh is rejected", async () => {
    markSessionHint();
    refreshAccessToken.mockRejectedValue(new Error("401"));

    const dispatch = recordingDispatch();
    await expect(restoreSession(dispatch)).resolves.toBeUndefined();

    const state = reduce(dispatch);
    expect(state.role).toBe(null);
    expect(state.token).toBe(null);
    expect(state.bootstrapped).toBe(true);
    expect(dispatch.actions.some((a) => a.type === setCredentials.type)).toBe(
      false
    );
    expect(endAuthBootstrap).toHaveBeenCalledTimes(1);
  });

  it("stays anonymous when refresh succeeds but no user can be resolved", async () => {
    markSessionHint();
    refreshAccessToken.mockResolvedValue(NEW_TOKEN);
    getCurrentUser.mockResolvedValue({ user: null, role: null });

    const dispatch = recordingDispatch();
    await restoreSession(dispatch);

    const state = reduce(dispatch);
    expect(state.role).toBe(null);
    expect(state.bootstrapped).toBe(true);
  });
});

// The shipped bug: StrictMode mounted the effect twice, a per-instance guard
// made the second mount a no-op, and the first run was cancelled mid-flight —
// so /me never ran and setBootstrapped(true) never fired.
describe("startSessionRestore under a StrictMode double mount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSessionRestoreForTests();
    clearAccessToken();
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetSessionRestoreForTests();
    clearAccessToken();
    clearAuthSideChannel();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("restores once and still completes when mounted twice", async () => {
    markSessionHint();
    refreshAccessToken.mockResolvedValue(NEW_TOKEN);
    getCurrentUser.mockResolvedValue({
      user: userFor("SURVEYOR"),
      role: "SURVEYOR",
    });

    const first = recordingDispatch();
    const second = recordingDispatch();

    const a = startSessionRestore(first);
    const b = startSessionRestore(second);
    expect(b).toBe(a);

    await Promise.all([a, b]);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(second.actions).toHaveLength(0);

    const state = reduce(first);
    expect(state.role).toBe("SURVEYOR");
    expect(state.bootstrapped).toBe(true);
  });

  it("does not re-run after the restore settles", async () => {
    markSessionHint();
    refreshAccessToken.mockResolvedValue(NEW_TOKEN);
    getCurrentUser.mockResolvedValue({ user: userFor("CAD"), role: "CAD" });

    const dispatch = recordingDispatch();
    await startSessionRestore(dispatch);
    await startSessionRestore(dispatch);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    // A second restore would re-verify the token it just stored.
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(reduce(dispatch).role).toBe("CAD");
  });

  it("still marks the session bootstrapped when the restore fails", async () => {
    markSessionHint();
    refreshAccessToken.mockRejectedValue(new Error("401"));

    const dispatch = recordingDispatch();
    await startSessionRestore(dispatch);
    await startSessionRestore(dispatch);

    expect(reduce(dispatch).bootstrapped).toBe(true);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});
