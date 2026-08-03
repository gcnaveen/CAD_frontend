/**
 * Public landing `#before-after` image catalog.
 *
 * Filename contract (must never be swapped):
 * - beforeSrc → `*-before-*` → hand-drawn / Tippani
 * - afterSrc  → `*-after-*`  → AutoCAD drawing
 *
 * Paths are under /public and served as absolute /assets/... URLs.
 */

/** @typedef {{ key: string, beforeSrc: string, afterSrc: string }} BeforeAfterAssetCard */

/** @type {readonly BeforeAfterAssetCard[]} */
export const BEFORE_AFTER_ASSETS = Object.freeze([
  Object.freeze({
    key: "residential",
    beforeSrc: "/assets/beforeafter/residential-before-CncuHBCP-320w.webp",
    afterSrc: "/assets/beforeafter/residential-after-B4Pd_a8V-320w.webp",
  }),
  Object.freeze({
    key: "partition",
    beforeSrc: "/assets/beforeafter/partition-before-DSD_eS2c-320w.webp",
    afterSrc: "/assets/beforeafter/partition-after-C94SAZFl-320w.webp",
  }),
  Object.freeze({
    key: "agricultural",
    beforeSrc: "/assets/beforeafter/agricultural-before-B1go6cYC-320w.webp",
    afterSrc: "/assets/beforeafter/agricultural-after-B8JTnCQA-320w.webp",
  }),
]);

/** Default English captions when translation cards are missing. */
export const BEFORE_AFTER_FALLBACK_COPY = Object.freeze({
  residential: Object.freeze({
    title: "Residential Plot",
    caption:
      "A residential survey plot in Tumkur district — Tippani to clean AutoCAD boundary drawing.",
  }),
  partition: Object.freeze({
    title: "Partition (Land Partition)",
    caption:
      "Partitioning a survey parcel — from hand-drawn notes to accurate AutoCAD layout.",
  }),
  agricultural: Object.freeze({
    title: "Agricultural Land",
    caption:
      "Agricultural survey documents — Tippani to professional AutoCAD drawing.",
  }),
});

/**
 * @param {string} src
 * @returns {boolean}
 */
export function isBeforeAssetSrc(src) {
  return typeof src === "string" && /(?:^|\/)[^/]*-before-[^/]*$/i.test(src);
}

/**
 * @param {string} src
 * @returns {boolean}
 */
export function isAfterAssetSrc(src) {
  return typeof src === "string" && /(?:^|\/)[^/]*-after-[^/]*$/i.test(src);
}

/**
 * Build cards for the landing section (assets + optional translated copy).
 * @param {{ cards?: Record<string, { title?: string, caption?: string }> } | null | undefined} tr
 */
export function buildBeforeAfterCards(tr) {
  const translated = tr?.cards;
  return BEFORE_AFTER_ASSETS.map((asset) => {
    const fallback = BEFORE_AFTER_FALLBACK_COPY[asset.key] || {};
    const copy = translated?.[asset.key] || {};
    return {
      key: asset.key,
      title: copy.title ?? fallback.title ?? asset.key,
      caption: copy.caption ?? fallback.caption ?? "",
      beforeSrc: asset.beforeSrc,
      afterSrc: asset.afterSrc,
    };
  });
}
