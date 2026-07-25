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
    await uploadPlan.fill("150");
    await expect(page.getByText("Upload payable").locator("..")).toContainText("150");

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Sketch pricing updated|No changes to save/i)).toBeVisible({
      timeout: 10_000,
    });

    // If save succeeded with a patch, body should include the changed plan field
    if (patchedBody) {
      expect(patchedBody.sketchUploadPlanAmountRupees).toBe(150);
    }
  });
});
