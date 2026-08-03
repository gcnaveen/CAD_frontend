import { describe, expect, it } from "vitest";
import {
  BEFORE_AFTER_ASSETS,
  buildBeforeAfterCards,
  isAfterAssetSrc,
  isBeforeAssetSrc,
} from "./beforeAfterAssets.js";

describe("beforeAfterAssets filename contract", () => {
  it("maps beforeSrc to *-before-* and afterSrc to *-after-* (no swap)", () => {
    expect(BEFORE_AFTER_ASSETS.length).toBeGreaterThanOrEqual(1);

    for (const card of BEFORE_AFTER_ASSETS) {
      expect(isBeforeAssetSrc(card.beforeSrc), `${card.key} beforeSrc`).toBe(
        true
      );
      expect(isAfterAssetSrc(card.afterSrc), `${card.key} afterSrc`).toBe(true);

      // Fail loudly if someone swaps the two paths.
      expect(isAfterAssetSrc(card.beforeSrc), `${card.key} before must not be after`).toBe(
        false
      );
      expect(isBeforeAssetSrc(card.afterSrc), `${card.key} after must not be before`).toBe(
        false
      );
    }
  });

  it("buildBeforeAfterCards preserves asset paths from the catalog", () => {
    const cards = buildBeforeAfterCards(null);
    expect(cards).toHaveLength(BEFORE_AFTER_ASSETS.length);
    cards.forEach((card, i) => {
      expect(card.beforeSrc).toBe(BEFORE_AFTER_ASSETS[i].beforeSrc);
      expect(card.afterSrc).toBe(BEFORE_AFTER_ASSETS[i].afterSrc);
      expect(isBeforeAssetSrc(card.beforeSrc)).toBe(true);
      expect(isAfterAssetSrc(card.afterSrc)).toBe(true);
    });
  });
});
