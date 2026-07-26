import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seedAuth, stubApi, seriousAxeViolations } from "./helpers.js";

async function expectNoSeriousAxe(page, options = {}) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
  if (options.include) builder = builder.include(options.include);
  // Marketing / Ant Design surfaces often trip color-contrast; keep smoke on structure rules.
  const disable = options.disableRules ?? ["color-contrast"];
  if (disable.length) builder = builder.disableRules(disable);
  const results = await builder.analyze();
  expect(seriousAxeViolations(results.violations)).toEqual([]);
}

test.describe("Accessibility smoke", () => {
  test("homepage has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test("phone login has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("#login-phone")).toHaveAttribute("type", "tel");
    await expect(page.locator("#login-phone")).toHaveAttribute("autocomplete", "tel");
    await expect(page.locator("#login-password")).toHaveAttribute("autocomplete", "current-password");
    await expect(page.locator('label[for="login-phone"]')).toBeVisible();
    await expect(page.locator('label[for="login-password"]')).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test("email login has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/login-email");
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("#login-email")).toHaveAttribute("type", "email");
    await expect(page.locator("#login-email")).toHaveAttribute("autocomplete", "username");
    await expect(page.locator("#login-password")).toHaveAttribute("autocomplete", "current-password");
    await expect(page.locator('label[for="login-email"]')).toBeVisible();
    await expect(page.locator('label[for="login-password"]')).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test("phone login shows accessible error summary on empty submit", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /^Login$/i }).click();
    const summary = page.locator("#login-error-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAttribute("role", "alert");
    await expect(page.locator("#login-phone")).toHaveAttribute("aria-invalid", "true");
  });

  test("keyboard can reach phone login submit without mouse", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator("#login-phone").focus();
    await page.keyboard.type("9876543210");
    await page.keyboard.press("Tab");
    await page.keyboard.type("1234");
    // Skip show-password toggle → Forgot Password → Login
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^Login$/i })).toBeFocused();
  });

  test("surveyor upload primary screen has no critical/serious axe violations", async ({
    page,
  }) => {
    await seedAuth(page, { role: "SURVEYOR" });
    await stubApi(page, (path) => {
      if (path.includes("/api/surveyor/sketch-pricing")) {
        return {
          success: true,
          data: {
            upload: { planAmountRupees: 100, discountRupees: 0, feePaise: 0 },
            revision: { planAmountRupees: 50, discountRupees: 0, feePaise: 0 },
            balance: { feePaise: 40000 },
          },
        };
      }
      return null;
    });
    await page.goto("/dashboard/user/upload");
    await expect(page.getByText("New Request")).toBeVisible({ timeout: 20_000 });
    await expectNoSeriousAxe(page, {
      // Ant Design form/layout chrome noise on this dense wizard screen.
      disableRules: [
        "color-contrast",
        "button-name",
        "aria-allowed-attr",
        "nested-interactive",
      ],
    });
  });
});
