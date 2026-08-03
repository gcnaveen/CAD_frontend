import { test, expect } from "@playwright/test";

/**
 * Visual contract for public `#before-after`:
 * Before img → *-before-* (Tippani), After img → *-after-* (AutoCAD).
 *
 * Section is behind LazySection + React.lazy, so hash alone does not mount it —
 * we scroll until `#before-after` appears.
 */
async function revealBeforeAfterSection(page) {
  await page.goto("/");
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });

  for (let i = 0; i < 40; i++) {
    const found = await page.locator("#before-after").count();
    if (found > 0) {
      await page.locator("#before-after").scrollIntoViewIfNeeded();
      return;
    }
    await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.85, 500)));
    await page.waitForTimeout(150);
  }

  // Final hash nudge after enough scroll (in case SPA updates location)
  await page.evaluate(() => {
    location.hash = "before-after";
  });
  await page.locator("#before-after").waitFor({ state: "attached", timeout: 15_000 });
  await page.locator("#before-after").scrollIntoViewIfNeeded();
}

test.describe("Before/After asset mapping", () => {
  test("each card Before/After img src matches filename contract and decodes", async ({
    page,
  }) => {
    await revealBeforeAfterSection(page);

    const section = page.locator("#before-after");
    await expect(section).toBeVisible({ timeout: 20_000 });

    const cards = section.locator(".ba-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();

      const beforeImg = card.locator('img[data-ba-role="before"]');
      const afterImg = card.locator('img[data-ba-role="after"]');

      await expect(beforeImg).toBeVisible();
      await expect(afterImg).toBeVisible();

      const beforeSrc = await beforeImg.getAttribute("src");
      const afterSrc = await afterImg.getAttribute("src");

      expect(beforeSrc, `card ${i} beforeSrc`).toMatch(/-before-/i);
      expect(beforeSrc, `card ${i} before must not be after`).not.toMatch(
        /-after-/i
      );
      expect(afterSrc, `card ${i} afterSrc`).toMatch(/-after-/i);
      expect(afterSrc, `card ${i} after must not be before`).not.toMatch(
        /-before-/i
      );

      await expect
        .poll(async () => beforeImg.evaluate((img) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect
        .poll(async () => afterImg.evaluate((img) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect
        .poll(async () =>
          beforeImg.evaluate((img) => img.complete && img.naturalHeight > 0)
        )
        .toBe(true);
      await expect
        .poll(async () =>
          afterImg.evaluate((img) => img.complete && img.naturalHeight > 0)
        )
        .toBe(true);
    }
  });
});
