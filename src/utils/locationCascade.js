/**
 * Cascade selects (district → taluka → …) must clear children only when the
 * parent id *changes*, not on first mount/remount with an already-selected parent.
 *
 * @param {string|null|undefined} prevParentId `undefined` = never observed yet
 * @param {string|null} nextParentId
 * @returns {boolean}
 */
export function shouldResetCascade(prevParentId, nextParentId) {
  if (prevParentId === undefined) return false;
  return prevParentId !== nextParentId;
}

/**
 * Whether dependent fields should be wiped for a parent-id transition.
 * Guards remount/watch hydration: null → id while children are already set.
 *
 * @param {{
 *   prevParentId: string|null|undefined,
 *   nextParentId: string|null,
 *   hasExistingChildren?: boolean,
 *   keepPrefill?: boolean,
 * }} opts
 */
export function shouldClearCascadeChildren({
  prevParentId,
  nextParentId,
  hasExistingChildren = false,
  keepPrefill = false,
} = {}) {
  if (keepPrefill) return false;
  if (!shouldResetCascade(prevParentId, nextParentId)) return false;
  if (prevParentId === null && nextParentId != null && hasExistingChildren) return false;
  return true;
}

/**
 * Normalize select/entity values to a stable id string (or null).
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeCascadeParentId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") {
    const s = String(value).trim();
    return s || null;
  }
  if (typeof value === "object") {
    const id = value.id ?? value._id ?? null;
    if (id == null || id === "") return null;
    return String(id);
  }
  return null;
}
