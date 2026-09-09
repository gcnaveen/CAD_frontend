import { test, expect } from "@playwright/test";
import { seedRestorableSession, stubApi } from "./helpers.js";

/**
 * M-02: browser refresh must not log anyone out.
 *
 * The access JWT is memory-only, so F5 has to renew it via POST /api/auth/refresh
 * and recover the role via GET /api/auth/me. Every role is covered because the
 * restore runs before any role is known.
 */

const CASES = [
  { role: "SUPER_ADMIN", home: "/superadmin", shell: ".superadmin-layout" },
  { role: "ADMIN", home: "/superadmin", shell: ".superadmin-layout" },
  { role: "CAD", home: "/dashboard/cad", shell: ".cad-layout" },
  { role: "CAD_USER", home: "/dashboard/cad", shell: ".cad-layout" },
  { role: "SURVEYOR", home: "/dashboard/user", shell: null },
  { role: "USER", home: "/dashboard/user", shell: null },
  { role: "CUSTOMER", home: "/dashboard/user", shell: null },
];

async function expectHomeRendered(page, shell) {
  if (shell) {
    await expect(page.locator(shell)).toBeVisible({ timeout: 20_000 });
  } else {
    await expect(page.getByText("Requests").first()).toBeVisible({
      timeout: 20_000,
    });
  }
  await expect(page.getByTestId("forbidden-page")).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page).not.toHaveURL(/\/403/);
}

for (const { role, home, shell } of CASES) {
  test.describe(`session survives refresh (${role})`, () => {
    test.beforeEach(async ({ page }) => {
      await stubApi(page);
      await seedRestorableSession(page, { role, profileCompleted: true });
    });

    test("cold load restores the session without a memory token", async ({
      page,
    }) => {
      await page.goto(home);
      await expectHomeRendered(page, shell);
    });

    test("reload keeps the user on their dashboard", async ({ page }) => {
      await page.goto(home);
      await expectHomeRendered(page, shell);

      await page.reload();
      await expectHomeRendered(page, shell);
    });
  });
}

test.describe("session restore keeps role isolation", () => {
  test("CAD deep-linking /superadmin after refresh still gets 403", async ({
    page,
  }) => {
    await stubApi(page);
    await seedRestorableSession(page, { role: "CAD", profileCompleted: true });

    await page.goto("/superadmin");
    await expect(page.getByTestId("forbidden-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/403/);
  });

  test("CAD with an incomplete profile still lands on /complete-profile", async ({
    page,
  }) => {
    await stubApi(page);
    await seedRestorableSession(page, { role: "CAD", profileCompleted: false });

    await page.goto("/dashboard/cad");
    await expect(page).toHaveURL(/\/complete-profile/, { timeout: 20_000 });
  });
});
