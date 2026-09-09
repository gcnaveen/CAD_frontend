import { getStoredCsrfToken } from "./authSideChannel.js";

/**
 * Double-submit CSRF for HttpOnly refresh-cookie flows (M-02 / B1).
 * Backend sets readable `cad_csrf`; login JSON also returns `csrfToken` because
 * the SPA cannot read API-Gateway cookies on a different origin.
 */

export const CSRF_COOKIE_NAME = "cad_csrf";
export const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * @param {string} [cookieString]
 * @returns {string | null}
 */
export function readCsrfTokenFromCookie(cookieString) {
  const raw =
    cookieString ??
    (typeof document !== "undefined" ? document.cookie : "");
  if (!raw) return null;
  const parts = String(raw).split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      const value = rest.join("=").trim();
      if (!value) return null;
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

export function resolveCsrfToken(cookieString) {
  return readCsrfTokenFromCookie(cookieString) || getStoredCsrfToken();
}

/**
 * Axios/request headers object including CSRF when cookie or login body token is present.
 * @param {Record<string, string>} [base]
 * @returns {Record<string, string>}
 */
export function withCsrfHeaders(base = {}) {
  const token = resolveCsrfToken();
  if (!token) return { ...base };
  return {
    ...base,
    [CSRF_HEADER_NAME]: token,
  };
}
