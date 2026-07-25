import { normalizeRoleKey } from "../constants/roles.js";

/**
 * Route prefix → allowed roles.
 * Keep in sync with docs/ROUTE_ROLE_MATRIX_M03.json
 */
export const ROUTE_ROLES = {
  "/superadmin": ["SUPER_ADMIN", "ADMIN"],
  "/admin": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/cad": ["CAD", "CAD_USER"],
  "/cad": ["CAD", "CAD_USER"],
  "/dashboard/user": ["SURVEYOR", "USER", "CUSTOMER"],
  "/surveyor": ["SURVEYOR", "USER", "CUSTOMER"],
  "/complete-profile": ["CAD", "CAD_USER"],
};

/**
 * Longest-prefix match against ROUTE_ROLES.
 * @param {string} pathname
 * @returns {string[] | null} allowed roles, or null if path is not role-scoped
 */
export function rolesForPath(pathname) {
  const path = String(pathname || "").split("?")[0] || "";
  const hit = Object.keys(ROUTE_ROLES)
    .sort((a, b) => b.length - a.length)
    .find((p) => path === p || path.startsWith(`${p}/`));
  return hit ? ROUTE_ROLES[hit] : null;
}

/**
 * @param {string} pathname
 * @param {string | null | undefined} role
 * @returns {boolean} true when path has no role map, or role is allowed
 */
export function isRoleAllowedForPath(pathname, role) {
  const allowed = rolesForPath(pathname);
  if (!allowed) return true;
  const key = normalizeRoleKey(role);
  if (!key) return false;
  return allowed.includes(key);
}
