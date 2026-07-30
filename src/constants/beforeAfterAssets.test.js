import { describe, expect, it } from "vitest";
import {
  BEFORE_AFTER_ASSET_CARDS,
  assertBeforeAfterAssetMapping,
} from "./beforeAfterAssets.js";

describe("Before/After asset mapping (public marketing)", () => {
  it("maps beforeSrc to *-before-* and afterSrc to *-after-* (not swapped)", () => {
    expect(() => assertBeforeAfterAssetMapping()).not.toThrow();
    for (const card of BEFORE_AFTER_ASSET_CARDS) {
      expect(card.beforeSrc).toMatch(/-before-/i);
      expect(card.afterSrc).toMatch(/-after-/i);
      expect(card.beforeSrc).not.toMatch(/-after-/i);
      expect(card.afterSrc).not.toMatch(/-before-/i);
    }
  });

  it("rejects a swapped mapping", () => {
    const swapped = [
      {
        key: "residential",
        beforeSrc: "/assets/beforeafter/residential-after-B4Pd_a8V.jpg",
        afterSrc: "/assets/beforeafter/residential-before-CncuHBCP.jpg",
      },
    ];
    expect(() => assertBeforeAfterAssetMapping(swapped)).toThrow(/beforeSrc|Swapped/i);
  });
});
