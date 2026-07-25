import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

test.describe("Surveyor upload / pay journey", () => {
  test("opens upload wizard with server pricing and pay-return state", async ({
    page,
  }) => {
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubApi(page, (path, method) => {
      if (path.includes("/api/surveyor/sketch-pricing") && method === "GET") {
        return {
          success: true,
          data: {
            upload: {
              planAmountRupees: 100,
              discountRupees: 0,
              feePaise: 0,
              payableRupees: 100,
            },
            revision: {
              planAmountRupees: 50,
              discountRupees: 0,
              feePaise: 0,
            },
            balance: { feePaise: 40000 },
          },
        };
      }
      if (path.match(/\/api\/surveyor\/sketch-uploads\/[^/]+$/) && method === "GET") {
        return {
          success: true,
          data: {
            _id: "upload-e2e-1",
            status: "PAYMENT_PENDING",
            sketchPayment: {
              status: "FAILED",
              payableRupees: 118,
              amountPaise: 11800,
            },
          },
        };
      }
      return null;
    });

    await page.goto("/dashboard/user/upload");
    await expect(page.getByText("New Request")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/ಹೊಸ CAD ವಿನಂತಿ/)).toBeVisible();

    // Payment return surface for retry after failed / amount-mismatch checkout
    await page.goto("/payment/return?uploadId=upload-e2e-1");
    await expect(page).not.toHaveURL(/\/login/);
    // Page should render (protected) and not bounce to login
    await expect(page.locator("body")).toBeVisible();
  });
});
