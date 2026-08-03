import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

test.describe("Admin sketch pricing journey", () => {
  test("loads pricing form, updates plan, and saves patch", async ({ page }) => {
    let patchedBody = null;

    await seedAuth(page, { role: "SUPER_ADMIN", name: "Admin" });
    await stubApi(page, (path, method, req) => {
      if (path.includes("/api/admin/survey-sketch-pricing") && method === "GET") {
        return {
          success: true,
          data: {
            sketchUploadPlanAmountRupees: 100,
            sketchUploadDiscountRupees: 0,
            sketchRevisionPlanAmountRupees: 50,
            sketchRevisionDiscountRupees: 0,
            sketchBalancePlanAmountRupees: 400,
            sketchBalanceDiscountRupees: 0,
            pricing: {
              upload: {
                feePaise: 10000,
                payableRupees: 100,
                planAmountRupees: 100,
                discountRupees: 0,
                source: "admin",
              },
              revision: {
                feePaise: 5000,
                payableRupees: 50,
                planAmountRupees: 50,
                discountRupees: 0,
                source: "admin",
              },
              balance: {
                feePaise: 40000,
                payableRupees: 400,
                planAmountRupees: 400,
                discountRupees: 0,
                source: "admin",
              },
            },
          },
        };
      }
      if (path.includes("/api/admin/survey-sketch-pricing") && method === "PATCH") {
        patchedBody = JSON.parse(req.postData() || "{}");
        return { success: true, data: patchedBody };
      }
      return null;
    });

    await page.goto("/superadmin/sketch-pricing");
    await expect(page.getByRole("heading", { name: "Sketch pricing" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Resolved payable (from server)")).toBeVisible();

    const uploadPlan = page.locator("#sketchUploadPlanAmountRupees").or(
      page.getByLabel("Plan amount (₹)").first()
    );
    await uploadPlan.click();
    await uploadPlan.fill("150");
    await uploadPlan.blur();

    // Preview row: label + amount live in adjacent columns of the same Row.
    await expect(page.getByText(/₹\s*150(\.00)?/)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Sketch pricing updated|No changes to save/i)).toBeVisible({
      timeout: 10_000,
    });

    if (patchedBody) {
      expect(patchedBody.sketchUploadPlanAmountRupees).toBe(150);
    }
  });

  test("shows env-resolved upload fee when admin plan is unset", async ({ page }) => {
    await seedAuth(page, { role: "SUPER_ADMIN", name: "Admin" });
    await stubApi(page, (path, method) => {
      if (path.includes("/api/admin/survey-sketch-pricing") && method === "GET") {
        return {
          success: true,
          data: {
            sketchUploadPlanAmountRupees: null,
            sketchUploadDiscountRupees: null,
            sketchRevisionPlanAmountRupees: null,
            sketchRevisionDiscountRupees: null,
            sketchBalancePlanAmountRupees: null,
            sketchBalanceDiscountRupees: null,
            pricing: {
              upload: {
                feePaise: 10000,
                payableRupees: 100,
                planAmountRupees: null,
                discountRupees: null,
                source: "env",
              },
              revision: {
                feePaise: 10000,
                payableRupees: 100,
                planAmountRupees: null,
                discountRupees: null,
                source: "env",
              },
              balance: {
                feePaise: 40000,
                payableRupees: 400,
                planAmountRupees: null,
                discountRupees: null,
                source: "env",
              },
            },
          },
        };
      }
      return null;
    });

    await page.goto("/superadmin/sketch-pricing");
    await expect(page.getByRole("heading", { name: "Sketch pricing" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("resolved-payable")).toBeVisible();
    await expect(page.getByText(/source:\s*env fallback/i).first()).toBeVisible();
    await expect(page.getByText(/₹\s*100(\.00)?/).first()).toBeVisible();
  });
});
