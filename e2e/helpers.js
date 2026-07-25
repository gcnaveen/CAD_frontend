/**
 * Playwright helpers: seed auth + stub API so journeys run without a live backend.
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ role: string, profileCompleted?: boolean, name?: string }} opts
 */
export async function seedAuth(page, opts) {
  const role = opts.role;
  const user = {
    id: `e2e-${role.toLowerCase()}`,
    role,
    profileCompleted: opts.profileCompleted ?? true,
    name: { first: opts.name || "E2E", last: "User" },
    phone: "9999999999",
  };
  const token = `e2e-token-${role}`;

  await page.addInitScript(
    ({ token: t, user: u }) => {
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem(
        "persist:auth",
        JSON.stringify({
          token: JSON.stringify(t),
          user: JSON.stringify(u),
          role: JSON.stringify(u.role),
          _persist: JSON.stringify({ version: -1, rehydrated: true }),
        })
      );
    },
    { token, user }
  );
}

/**
 * Default API stub: avoid 401 logout; override specific routes in tests.
 * @param {import('@playwright/test').Page} page
 * @param {(url: string, method: string) => object | null | undefined} [override]
 */
export async function stubApi(page, override) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    const path = new URL(url).pathname;

    const custom = override?.(path, method, req);
    if (custom !== undefined && custom !== null) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(custom),
      });
      return;
    }

    // Quiet defaults for dashboard chrome / masters
    if (path.includes("/notifications")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }
    if (path.includes("/districts") || path.includes("/talukas") || path.includes("/hoblis") || path.includes("/villages")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });
}

/**
 * Fail CI only on critical/serious axe violations (smoke gate).
 * @param {import('axe-core').Result[]} violations
 */
export function seriousAxeViolations(violations) {
  return (violations || []).filter((v) =>
    ["critical", "serious"].includes(String(v.impact || "").toLowerCase())
  );
}
