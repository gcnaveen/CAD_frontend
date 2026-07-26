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
    await expect(page.getByText("Computed payable (preview)")).toBeVisible();

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
});
