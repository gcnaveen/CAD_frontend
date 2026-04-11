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

/** Match USER_KEY in services/apiClient.js */
const LS_USER_KEY = "user";

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
 * Prefer Redux `auth.role`, then `auth.user.role`, then persisted user in localStorage.
 */
export function resolveStoredUserRole(roleFromSlice, userRoleFromSlice) {
  const r = roleFromSlice ?? userRoleFromSlice;
  if (r != null && String(r).trim() !== "") return r;
  try {
    const raw = localStorage.getItem(LS_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}
