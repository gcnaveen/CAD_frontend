import { test, expect } from "@playwright/test";

/**
 * Visual/DOM contract: Before img must load *-before-* asset; After img *-after-*.
 * Catches swapped source mapping on the public homepage #before-after section.
 */
test.describe("Before/After visual mapping", () => {
  test("homepage before/after cards use correct asset filenames", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#before-after");
    await expect(section).toBeVisible({ timeout: 20_000 });
    await section.scrollIntoViewIfNeeded();

    const mediaBlocks = section.locator(".ba-media");
    await expect(mediaBlocks).toHaveCount(3);

    for (let i = 0; i < 3; i += 1) {
      const block = mediaBlocks.nth(i);
      const beforeImg = block.locator('img.ba-img--before, img[alt="Before"]');
      const afterImg = block.locator('img.ba-img--after, img[alt="After"]');
      await expect(beforeImg).toBeVisible();
      await expect(afterImg).toBeVisible();

      const beforeSrc = await beforeImg.getAttribute("src");
      const afterSrc = await afterImg.getAttribute("src");
      expect(beforeSrc, `card ${i} beforeSrc`).toMatch(/-before-/i);
      expect(afterSrc, `card ${i} afterSrc`).toMatch(/-after-/i);
      expect(beforeSrc, `card ${i} before not after`).not.toMatch(/-after-/i);
      expect(afterSrc, `card ${i} after not before`).not.toMatch(/-before-/i);

      // Visual smoke: both images resolve (natural size > 0 once loaded)
      await expect(beforeImg).toHaveJSProperty("complete", true);
      await expect(afterImg).toHaveJSProperty("complete", true);
      const beforeOk = await beforeImg.evaluate((img) => img.naturalWidth > 0);
      const afterOk = await afterImg.evaluate((img) => img.naturalWidth > 0);
      expect(beforeOk, `card ${i} before image decoded`).toBe(true);
      expect(afterOk, `card ${i} after image decoded`).toBe(true);
    }
  });
});
