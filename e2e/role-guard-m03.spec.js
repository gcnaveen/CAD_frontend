import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

/**
 * M-03: role-aware route protection.
 * Wrong-role deep-links must show bare 403 — never the other role's shell.
 */

const CASES = [
  {
    role: "SURVEYOR",
    home: "/dashboard/user",
    forbidden: [
      { path: "/superadmin", shellText: "Super Admin" },
      { path: "/dashboard/cad", shellText: "View Current Projects" },
    ],
  },
  {
    role: "CAD",
    home: "/dashboard/cad",
    forbidden: [
      { path: "/superadmin", shellText: "Super Admin" },
      { path: "/dashboard/user", shellText: "Requests" },
    ],
  },
  {
    role: "ADMIN",
    home: "/superadmin",
    forbidden: [
      { path: "/dashboard/cad", shellText: "View Current Projects" },
      { path: "/dashboard/user", shellText: "Requests" },
    ],
  },
];

for (const { role, home, forbidden } of CASES) {
  test.describe(`M-03 role guard (${role})`, () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page, {
        role,
        profileCompleted: true,
        name: role,
      });
      await stubApi(page);

      // Backend source-of-truth: wrong-role admin APIs → 403
      await page.route("**/api/admin/**", async (route) => {
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: {} }),
          });
          return;
        }
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ success: false, message: "Forbidden" }),
        });
      });
    });

    for (const { path, shellText } of forbidden) {
      test(`deep-link ${path} → 403, not shell`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByTestId("forbidden-page")).toBeVisible();
        await expect(page).toHaveURL(/\/403/);
        await expect(page.getByText("Access denied")).toBeVisible();
        await expect(page.getByText(shellText)).toHaveCount(0);
        await expect(page.locator(".superadmin-layout")).toHaveCount(0);
        await expect(page.locator(".cad-layout")).toHaveCount(0);
      });
    }

    test(`own home loads without 403`, async ({ page }) => {
      await page.goto(home);
      await expect(page.getByTestId("forbidden-page")).toHaveCount(0);
      await expect(page).not.toHaveURL(/\/403/);
      if (role === "ADMIN") {
        await expect(page.locator(".superadmin-layout")).toBeVisible({
          timeout: 15_000,
        });
      } else if (role === "CAD") {
        await expect(page.locator(".cad-layout")).toBeVisible({
          timeout: 15_000,
        });
      } else {
        await expect(page.getByText("Requests").first()).toBeVisible({
          timeout: 15_000,
        });
      }
    });

    test(`nav does not expose forbidden sections`, async ({ page }) => {
      await page.goto(home);
      await expect(page.getByTestId("forbidden-page")).toHaveCount(0);

      if (role === "ADMIN") {
        await expect(page.getByText("View Admin Users")).toHaveCount(0);
        await expect(page.getByText("Sketch pricing")).toHaveCount(0);
        await expect(page.getByText("Payment reconciliation")).toBeVisible();
      }
      if (role === "CAD") {
        await expect(page.getByText("View Admin Users")).toHaveCount(0);
        await expect(page.getByText("View Projects")).toHaveCount(0);
      }
      if (role === "SURVEYOR") {
        await expect(page.getByText("View Admin Users")).toHaveCount(0);
        await expect(page.getByText("Pay CAD User")).toHaveCount(0);
      }
    });
  });
}

test.describe("M-03 API 401 source of truth", () => {
  test("expired token on protected API clears session toward login", async ({
    page,
  }) => {
    await seedAuth(page, { role: "SURVEYOR", profileCompleted: true });
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Unauthorized" }),
      });
    });
    await page.goto("/dashboard/user");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
