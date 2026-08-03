import { getStoredAccessToken } from "./authToken.js";
import { normalizeRoleKey, ROLES } from "../constants/roles.js";

/** Paths that must not be reachable while a session token exists. */
export const AUTH_ONLY_PATHS = new Set([
  "/login",
  "/login-email",
  "/login/email",
  "/register",
  "/register/cad-operator",
  "/enroll",
]);

/**
 * Role-based post-login / guest-route destination.
 */
export function getRedirectForRole(role) {
  const r = normalizeRoleKey(role);
  if (r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN) return "/superadmin";
  if (r === ROLES.CAD || r === ROLES.CAD_USER) return "/dashboard/cad";
  if (r === ROLES.SURVEYOR || r === ROLES.USER || r === ROLES.CUSTOMER) return "/dashboard/user";
  return "/";
}

export function isAuthOnlyPath(pathname = "") {
  return AUTH_ONLY_PATHS.has(pathname);
}

/** Prefer Redux token; fall back to in-memory access token. */
export function resolveSessionToken(reduxToken) {
  if (reduxToken) return reduxToken;
  return getStoredAccessToken();
}
