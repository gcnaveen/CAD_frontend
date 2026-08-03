/**
 * Application role constants (aligned with backend).
 * Use these instead of hardcoded strings for role checks.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CAD: "CAD",
  CAD_USER: "CAD_USER",
  SURVEYOR: "SURVEYOR",
  USER: "USER",
  CUSTOMER: "CUSTOMER",
};

/**
 * Normalize backend / UI role strings for comparison (e.g. "super_admin", "Super Admin" → "SUPER_ADMIN").
 */
export function normalizeRoleKey(role) {
  if (role == null) return null;
  const s = String(role).trim();
  if (!s) return null;
  const n = s.toUpperCase().replace(/\s+/g, "_");
  if (n === "SUPERADMIN") return ROLES.SUPER_ADMIN;
  return n;
}

/**
 * Prefer Redux `auth.role`, then `auth.user.role`. Does not read localStorage.
 */
export function resolveStoredUserRole(roleFromSlice, userRoleFromSlice) {
  const r = roleFromSlice ?? userRoleFromSlice;
  if (r != null && String(r).trim() !== "") return r;
  return null;
}
