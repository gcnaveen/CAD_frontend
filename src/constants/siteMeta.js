/**
 * L-01 — North-cot brand, SEO, and PWA metadata (single source of truth).
 * Absolute URLs use VITE_SITE_URL (e.g. https://northcot.in); fall back for local/dev.
 */

export const BRAND_NAME = "North-cot";
export const BRAND_NAME_FULL = "North-cot — Land Survey & CAD Documentation";
export const BRAND_SHORT_NAME = "North-cot";

export const SITE_DESCRIPTION =
  "North-cot helps licensed land surveyors in Karnataka order CAD drawings and revenue documentation online — upload sketches, track orders, and get QC-assured deliverables.";

/** Browser chrome / PWA theme — matches --brand-green */
export const THEME_COLOR = "#152815";
/** Splash / install background — matches --brand-green-deep */
export const BACKGROUND_COLOR = "#0d1f0d";

export const DEFAULT_SITE_ORIGIN = "https://northcot.in";

export const OG_IMAGE_PATH = "/og-image.png";
export const APPLE_TOUCH_ICON_PATH = "/apple-touch-icon.png";

/** Public paths that may be indexed (marketing + auth entry). */
export const INDEXABLE_PATH_PREFIXES = [
  "/",
  "/login",
  "/login-email",
  "/login/email",
  "/register",
  "/register/cad-operator",
  "/privacy-policy",
  "/terms-and-conditions",
];

/**
 * Private app surfaces — must not appear in search results.
 * Auth-gated routes; robots.txt Disallow mirrors these prefixes.
 */
export const NOINDEX_PATH_PREFIXES = [
  "/dashboard",
  "/superadmin",
  "/admin",
  "/complete-profile",
  "/profile",
  "/payment",
  "/payment-success",
  "/payment-failure",
  "/cad",
  "/surveyor",
  "/403",
];

export function getSiteOrigin() {
  const fromEnv = (import.meta.env.VITE_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_ORIGIN;
}

export function absoluteUrl(path = "/") {
  const origin = getSiteOrigin();
  if (!path || path === "/") return `${origin}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function isIndexablePath(pathname) {
  if (!pathname) return false;
  const path = pathname.split("?")[0].split("#")[0] || "/";
  if (NOINDEX_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return false;
  }
  return INDEXABLE_PATH_PREFIXES.some(
    (p) => path === p || (p !== "/" && path.startsWith(`${p}/`))
  );
}

export function titleForPath(pathname) {
  const path = (pathname || "/").split("?")[0] || "/";
  const map = {
    "/": BRAND_NAME_FULL,
    "/login": `Sign in · ${BRAND_NAME}`,
    "/login-email": `Sign in with email · ${BRAND_NAME}`,
    "/login/email": `Sign in with email · ${BRAND_NAME}`,
    "/register": `Register · ${BRAND_NAME}`,
    "/register/cad-operator": `CAD operator registration · ${BRAND_NAME}`,
    "/privacy-policy": `Privacy Policy · ${BRAND_NAME}`,
    "/terms-and-conditions": `Terms & Conditions · ${BRAND_NAME}`,
  };
  if (map[path]) return map[path];
  if (!isIndexablePath(path)) return `${BRAND_NAME} App`;
  return BRAND_NAME_FULL;
}
