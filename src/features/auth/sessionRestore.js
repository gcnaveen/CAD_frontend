/**
 * M-02 session restore after browser refresh.
 *
 * The access JWT is memory-only, so F5 renews it via POST /api/auth/refresh and
 * then recovers the role via GET /api/auth/me (refresh JSON carries no user).
 * If /me is unavailable the sessionStorage user snapshot captured at login is
 * used, so no role depends on /me being reachable.
 *
 * Kept out of the React component so every role can be covered by unit tests.
 */
import { setCredentials, setBootstrapped } from "./authSlice.js";
import {
  getAccessToken,
  setAccessToken,
  clearLegacyAuthStorage,
  isUsableTabUser,
} from "../../utils/authToken.js";
import {
  shouldAttemptSessionRestore,
  getUserSnapshot,
} from "../../utils/authSideChannel.js";
import {
  refreshAccessToken,
  getCurrentUser,
} from "../../services/auth/authService.js";
import {
  beginAuthBootstrap,
  endAuthBootstrap,
} from "../../services/apiClient.js";

/** /me must not trigger the 401 refresh interceptor — restore drives refresh. */
const ME_OPTS = { skipAuthRefresh: true };

function applyMe(dispatch, accessToken, me) {
  const user = me?.user;
  if (!isUsableTabUser(user)) return false;
  dispatch(
    setCredentials({
      token: accessToken,
      user: me.role ? { ...user, role: user.role ?? me.role } : user,
    })
  );
  return true;
}

function applySnapshot(dispatch, accessToken) {
  const snapshot = getUserSnapshot();
  if (!isUsableTabUser(snapshot)) return false;
  dispatch(setCredentials({ token: accessToken, user: snapshot }));
  return true;
}

async function hydrateUser(dispatch, accessToken) {
  try {
    const me = await getCurrentUser(ME_OPTS);
    if (applyMe(dispatch, accessToken, me)) return true;
  } catch {
    /* fall through to the login snapshot */
  }
  return applySnapshot(dispatch, accessToken);
}

/**
 * Restore the tab session exactly once per page load.
 * Never rejects: every exit path marks the session bootstrapped so
 * ProtectedRoute can decide instead of rendering a fallback forever.
 * @param {(action: unknown) => unknown} dispatch
 * @returns {Promise<void>}
 */
export async function restoreSession(dispatch) {
  beginAuthBootstrap();
  try {
    clearLegacyAuthStorage();

    const existing = getAccessToken();
    if (existing && (await hydrateUser(dispatch, existing))) return;
    if (!existing && !shouldAttemptSessionRestore()) return;

    const next = await refreshAccessToken();
    setAccessToken(next);
    await hydrateUser(dispatch, next);
  } catch {
    /* no restorable session — stay anonymous */
  } finally {
    endAuthBootstrap();
    dispatch(setBootstrapped(true));
  }
}

/** @type {Promise<void> | null} */
let pendingRestore = null;

/**
 * Deduped, page-load scoped entry point.
 *
 * StrictMode mounts the bootstrap effect twice. A per-instance guard let the
 * first (already cancelled) run own the restore, so /me was never called and
 * the app sat on the route fallback forever. Module scope survives remounts.
 * @param {(action: unknown) => unknown} dispatch
 * @returns {Promise<void>}
 */
export function startSessionRestore(dispatch) {
  if (!pendingRestore) {
    pendingRestore = restoreSession(dispatch);
  }
  return pendingRestore;
}

/** @internal Test-only: module scope is otherwise page-load scoped. */
export function resetSessionRestoreForTests() {
  pendingRestore = null;
}
