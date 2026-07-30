/**
 * Public Before/After marketing assets.
 * beforeSrc = hand-drawn / tippani (*-before-*)
 * afterSrc  = AutoCAD drawing (*-after-*)
 * Filenames encode role — never swap keys.
 */

export const BEFORE_AFTER_ASSET_CARDS = Object.freeze([
  Object.freeze({
    key: "residential",
    title: "Residential Plot",
    caption:
      "A residential survey plot in Tumkur district — Tippani to clean AutoCAD boundary drawing.",
    beforeSrc: "/assets/beforeafter/residential-before-CncuHBCP.jpg",
    afterSrc: "/assets/beforeafter/residential-after-B4Pd_a8V.jpg",
  }),
  Object.freeze({
    key: "partition",
    title: "Partition (Land Partition)",
    caption:
      "Partitioning a survey parcel — from hand-drawn notes to accurate AutoCAD layout.",
    beforeSrc: "/assets/beforeafter/partition-before-DSD_eS2c.jpg",
    afterSrc: "/assets/beforeafter/partition-after-C94SAZFl.jpg",
  }),
  Object.freeze({
    key: "agricultural",
    title: "Agricultural Land",
    caption:
      "Agricultural survey documents — Tippani to professional AutoCAD drawing.",
    beforeSrc: "/assets/beforeafter/agricultural-before-B1go6cYC.jpg",
    afterSrc: "/assets/beforeafter/agricultural-after-B8JTnCQA.jpg",
  }),
]);

/** Throws if any card maps before↔after incorrectly (filename contract). */
export function assertBeforeAfterAssetMapping(cards = BEFORE_AFTER_ASSET_CARDS) {
  for (const card of cards) {
    if (!card?.beforeSrc || !/-before-/i.test(card.beforeSrc)) {
      throw new Error(
        `beforeSrc must reference a *-before-* asset (card=${card?.key}): ${card?.beforeSrc}`
      );
    }
    if (!card?.afterSrc || !/-after-/i.test(card.afterSrc)) {
      throw new Error(
        `afterSrc must reference a *-after-* asset (card=${card?.key}): ${card?.afterSrc}`
      );
    }
    if (/-after-/i.test(card.beforeSrc) || /-before-/i.test(card.afterSrc)) {
      throw new Error(`Swapped before/after assets for card=${card?.key}`);
    }
  }
  return true;
}
