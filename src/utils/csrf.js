/**
 * Double-submit CSRF for HttpOnly refresh-cookie flows (M-02 / B1).
 * Backend sets readable `cad_csrf`; FE must send `X-CSRF-Token` on credentialed mutations.
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

/**
 * Axios/request headers object including CSRF when cookie is present.
 * @param {Record<string, string>} [base]
 * @returns {Record<string, string>}
 */
export function withCsrfHeaders(base = {}) {
  const token = readCsrfTokenFromCookie();
  if (!token) return { ...base };
  return {
    ...base,
    [CSRF_HEADER_NAME]: token,
  };
}
