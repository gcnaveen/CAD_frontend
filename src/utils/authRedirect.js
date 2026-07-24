import { TOKEN_KEY } from "../services/apiClient";

/** Paths that must not be reachable while a session token exists. */
export const AUTH_ONLY_PATHS = new Set([
  "/login",
  "/login-email",
  "/login/email",
  "/register",
  "/register/cad-operator",
]);

/**
 * Role-based post-login / guest-route destination.
 */
export function getRedirectForRole(role) {
  const r = (role || "").toUpperCase();
  if (r === "SUPER_ADMIN" || r === "ADMIN") return "/superadmin";
  if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
  if (r === "SURVEYOR" || r === "USER" || r === "CUSTOMER") return "/dashboard/user";
  return "/";
}

export function isAuthOnlyPath(pathname = "") {
  return AUTH_ONLY_PATHS.has(pathname);
}

/** Prefer Redux token; fall back to localStorage (same source API uses). */
export function resolveSessionToken(reduxToken) {
  if (reduxToken) return reduxToken;
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
