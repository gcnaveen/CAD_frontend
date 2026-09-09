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
      window.__CAD_E2E_ACCESS_TOKEN__ = t;
      window.__CAD_E2E_USER__ = u;
      try {
        localStorage.removeItem("persist:auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {
        /* ignore */
      }
    },
    { token, user }
  );

  // Bootstrap may call refresh/me; seed in-memory auth without localStorage JWT.
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: "No refresh session" }),
    });
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: user }),
    });
  });
}

/**
 * Seed a tab that logged in and was then refreshed (F5).
 *
 * Unlike seedAuth, no in-memory JWT is injected: only the sessionStorage side
 * channel survives a reload, so the app must actually run POST /api/auth/refresh
 * followed by GET /api/auth/me. seedAuth re-injects its window token on every
 * navigation, which silently skips that path.
 *
 * Register this AFTER stubApi so the auth routes win (last route wins).
 * @param {import('@playwright/test').Page} page
 * @param {{ role: string, profileCompleted?: boolean, name?: string }} opts
 */
export async function seedRestorableSession(page, opts) {
  const role = opts.role;
  const user = {
    id: `e2e-${String(role).toLowerCase()}`,
    role,
    profileCompleted: opts.profileCompleted ?? true,
    name: { first: opts.name || "E2E", last: "User" },
    phone: "9999999999",
  };
  const token = `e2e-refreshed-token-${role}`;

  await page.addInitScript((seedUser) => {
    try {
      sessionStorage.setItem("cad_session_hint", "1");
      sessionStorage.setItem("cad_refresh_body", "e2e-body-refresh-token");
      sessionStorage.setItem("cad_csrf_token", "e2e-csrf-token");
      sessionStorage.setItem("cad_user_snapshot", JSON.stringify(seedUser));
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
  }, user);

  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          token,
          accessToken: token,
          refreshToken: "e2e-body-refresh-token",
          csrfToken: "e2e-csrf-token",
          expiresIn: "15m",
        },
      }),
    });
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { user, role } }),
    });
  });

  return user;
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

    if (path.includes("/auth/refresh")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "No refresh session" }),
      });
      return;
    }

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
