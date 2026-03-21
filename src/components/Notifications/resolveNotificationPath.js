/**
 * Returns a safe in-app path when the app already has a matching route.
 * Does not append entityId — list/detail deep links are not defined in routes.
 */
export function resolveNotificationPath(layout, entityType) {
  const t = (entityType || "").toString().toUpperCase();
  if (!t) return null;

  const orderLike = new Set([
    "ORDER",
    "SKETCH",
    "SKETCH_UPLOAD",
    "UPLOAD",
    "SKETCHUPLOAD",
  ]);

  if (orderLike.has(t)) {
    if (layout === "user") return "/dashboard/user/track-order";
    if (layout === "cad") return "/dashboard/cad/current-orders";
    if (layout === "superadmin") return "/superadmin/projects";
    return null;
  }

  if (t === "PROJECT") {
    if (layout === "superadmin") return "/superadmin/projects";
    if (layout === "cad") return "/dashboard/cad/current-orders";
    return null;
  }

  return null;
}
