import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  BRAND_NAME,
  SITE_DESCRIPTION,
  THEME_COLOR,
  OG_IMAGE_PATH,
  absoluteUrl,
  isIndexablePath,
  titleForPath,
} from "../constants/siteMeta";

function upsertMeta(attr, key, content) {
  if (content == null || content === "") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * L-01 — Keep document title, canonical, robots, and OG tags in sync with the route.
 * Private app routes stay noindex; public marketing/auth pages stay indexable.
 */
export default function DocumentMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const indexable = isIndexablePath(pathname);
    const title = titleForPath(pathname);
    const canonical = absoluteUrl(pathname === "/" ? "/" : pathname);
    const ogImage = absoluteUrl(OG_IMAGE_PATH);
    const robots = indexable
      ? "index, follow"
      : "noindex, nofollow";

    document.title = title;
    upsertLink("canonical", canonical);
    upsertMeta("name", "description", SITE_DESCRIPTION);
    upsertMeta("name", "theme-color", THEME_COLOR);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", BRAND_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", SITE_DESCRIPTION);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:locale", "en_IN");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", SITE_DESCRIPTION);
    upsertMeta("name", "twitter:image", ogImage);
  }, [pathname]);

  return null;
}
