/**
 * M-02: Access JWT lives in memory only (never localStorage / sessionStorage).
 * Session renewal uses HttpOnly refresh cookies via POST /api/auth/refresh.
 */

/** Legacy key names — cleared on logout; never written for new sessions. */
export const TOKEN_KEY = "token";
export const USER_KEY = "user";

/** E2E one-shot seed (Playwright addInitScript); never used in production auth path. */
export const E2E_ACCESS_TOKEN_KEY = "__CAD_E2E_ACCESS_TOKEN__";
export const E2E_USER_KEY = "__CAD_E2E_USER__";

/** @type {string | null} */
let accessTokenMemory = null;

/**
 * Pull Bearer JWT from auth API payloads (login / register / reset / refresh).
 * @param {unknown} payload
 * @returns {string | null}
 */
export function extractAccessToken(payload) {
  if (payload == null) return null;
  if (typeof payload === "string") {
    const t = payload.trim();
    return t || null;
  }
  if (typeof payload !== "object") return null;

  const direct = [
    payload.accessToken,
    payload.access_token,
    payload.token,
  ];
  for (const value of direct) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const nested = payload.data;
  if (nested && typeof nested === "object") {
    return extractAccessToken(nested);
  }
  return null;
}

/**
 * @returns {string | null}
 */
export function getAccessToken() {
  if (accessTokenMemory) return accessTokenMemory;
  if (typeof window !== "undefined") {
    const seeded = window[E2E_ACCESS_TOKEN_KEY];
    if (typeof seeded === "string" && seeded.trim()) {
      accessTokenMemory = seeded.trim();
      try {
        delete window[E2E_ACCESS_TOKEN_KEY];
      } catch {
        /* ignore */
      }
      return accessTokenMemory;
    }
  }
  return null;
}

/** @deprecated Use getAccessToken — kept for call-site compatibility during migration. */
export function getStoredAccessToken() {
  return getAccessToken();
}

/**
 * Store access token in memory only.
 * @param {string | null | undefined} token
 */
export function setAccessToken(token) {
  const value = typeof token === "string" ? token.trim() : "";
  accessTokenMemory = value || null;
}

/** @deprecated Use setAccessToken */
export function storeAccessToken(token) {
  setAccessToken(token);
}

export function clearAccessToken() {
  accessTokenMemory = null;
}

/**
 * Remove any legacy persisted auth secrets from Web Storage.
 */
export function clearLegacyAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("persist:auth");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Read one-shot E2E user seed (if present).
 * @returns {object | null}
 */
export function consumeE2EUserSeed() {
  if (typeof window === "undefined") return null;
  const user = window[E2E_USER_KEY];
  if (user && typeof user === "object") {
    try {
      delete window[E2E_USER_KEY];
    } catch {
      /* ignore */
    }
    return user;
  }
  return null;
}
