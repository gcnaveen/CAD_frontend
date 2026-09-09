/**
 * Cross-origin session restore (API Gateway ≠ app origin).
 * Access JWT stays in memory. CSRF + body-compat refresh token live in
 * sessionStorage (never localStorage) so F5 can call POST /api/auth/refresh.
 */

export const CSRF_SESSION_KEY = "cad_csrf_token";
export const REFRESH_BODY_SESSION_KEY = "cad_refresh_body";
export const SESSION_HINT_KEY = "cad_session_hint";
export const USER_SNAPSHOT_KEY = "cad_user_snapshot";

/** @type {string | null} */
let csrfMemory = null;
/** @type {string | null} */
let refreshBodyMemory = null;

function sessionGet(key) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const value = sessionStorage.getItem(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

function sessionSet(key, value) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const next = typeof value === "string" ? value.trim() : "";
    if (!next) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, next);
  } catch {
    /* quota / private mode */
  }
}

function sessionRemove(key) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function setCsrfToken(token) {
  const value = typeof token === "string" ? token.trim() : "";
  csrfMemory = value || null;
  sessionSet(CSRF_SESSION_KEY, csrfMemory);
}

export function getStoredCsrfToken() {
  if (csrfMemory) return csrfMemory;
  csrfMemory = sessionGet(CSRF_SESSION_KEY);
  return csrfMemory;
}

export function setBodyRefreshToken(token) {
  const value = typeof token === "string" ? token.trim() : "";
  refreshBodyMemory = value || null;
  sessionSet(REFRESH_BODY_SESSION_KEY, refreshBodyMemory);
}

export function getBodyRefreshToken() {
  if (refreshBodyMemory) return refreshBodyMemory;
  refreshBodyMemory = sessionGet(REFRESH_BODY_SESSION_KEY);
  return refreshBodyMemory;
}

export function markSessionHint() {
  sessionSet(SESSION_HINT_KEY, "1");
}

export function hasSessionHint() {
  return sessionGet(SESSION_HINT_KEY) === "1" || Boolean(getBodyRefreshToken());
}

export function clearAuthSideChannel() {
  csrfMemory = null;
  refreshBodyMemory = null;
  sessionRemove(CSRF_SESSION_KEY);
  sessionRemove(REFRESH_BODY_SESSION_KEY);
  sessionRemove(SESSION_HINT_KEY);
  sessionRemove(USER_SNAPSHOT_KEY);
}

export function setUserSnapshot(user) {
  if (!user || typeof user !== "object") return;
  try {
    const copy = JSON.parse(JSON.stringify(user));
    delete copy.token;
    delete copy.accessToken;
    delete copy.refreshToken;
    delete copy.csrfToken;
    sessionSet(USER_SNAPSHOT_KEY, JSON.stringify(copy));
  } catch {
    try {
      const slim = {
        id: user.id ?? user._id ?? null,
        _id: user._id ?? null,
        role: user.role ?? null,
        name: user.name ?? null,
        profileCompleted: user.profileCompleted ?? null,
        auth: user.auth ? { phone: user.auth.phone } : undefined,
      };
      sessionSet(USER_SNAPSHOT_KEY, JSON.stringify(slim));
    } catch {
      /* ignore */
    }
  }
}

export function getUserSnapshot() {
  const raw = sessionGet(USER_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Only auth endpoints may write the session snapshot. `GET /api/users/:id`
 * also returns a `user`, and capturing it would restore the wrong role after F5.
 * @param {unknown} url
 */
export function isAuthSideChannelUrl(url) {
  return String(url ?? "").includes("/api/auth/");
}

/**
 * Pull csrfToken / refreshToken from login or refresh JSON (never logs values).
 * @param {unknown} payload
 */
export function captureAuthSideChannel(payload) {
  if (!payload || typeof payload !== "object") return;
  const layers = [payload, payload.data, payload.data?.data];
  for (const layer of layers) {
    if (!layer || typeof layer !== "object") continue;
    if (typeof layer.csrfToken === "string" && layer.csrfToken.trim()) {
      setCsrfToken(layer.csrfToken);
    }
    if (typeof layer.refreshToken === "string" && layer.refreshToken.trim()) {
      setBodyRefreshToken(layer.refreshToken);
    }
    if (layer.user && typeof layer.user === "object") {
      setUserSnapshot(layer.user);
    }
    if (
      typeof layer.accessToken === "string" ||
      typeof layer.token === "string" ||
      typeof layer.refreshToken === "string"
    ) {
      markSessionHint();
    }
  }
}

/**
 * JSON body for POST /api/auth/refresh (cookie still sent via credentials).
 * @returns {Record<string, string>}
 */
export function buildRefreshRequestBody() {
  const body = {};
  const refreshToken = getBodyRefreshToken();
  const csrfToken = getStoredCsrfToken();
  if (refreshToken) body.refreshToken = refreshToken;
  if (csrfToken) body.csrfToken = csrfToken;
  return body;
}

export function shouldAttemptSessionRestore() {
  return hasSessionHint() || Boolean(getStoredCsrfToken()) || Boolean(getBodyRefreshToken());
}
