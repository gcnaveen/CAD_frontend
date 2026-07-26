/** Canonical localStorage key for JWT (Authorization: Bearer). */
export const TOKEN_KEY = "token";
export const USER_KEY = "user";

/**
 * Pull Bearer JWT from auth API payloads (login / register / reset).
 * Backend may return `accessToken`, `access_token`, or legacy `token`.
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
 * Token used for Authorization: Bearer on apiClient / upload calls.
 * @returns {string | null}
 */
export function getStoredAccessToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (typeof token === "string" && token.trim()) return token.trim();
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Persist access token under the canonical localStorage key.
 * @param {string | null | undefined} token
 */
export function storeAccessToken(token) {
  const value = typeof token === "string" ? token.trim() : "";
  if (!value) return;
  localStorage.setItem(TOKEN_KEY, value);
}
