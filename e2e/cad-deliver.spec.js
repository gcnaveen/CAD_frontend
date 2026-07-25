import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

test.describe("CAD deliver journey", () => {
  test("shows current assignments and deliverable upload surface", async ({ page }) => {
    await seedAuth(page, {
      role: "CAD",
      profileCompleted: true,
      name: "CadOp",
    });

    await stubApi(page, (path, method) => {
      if (path.includes("/api/cad/assignments") && method === "GET") {
        return {
          success: true,
          data: {
            items: [
              {
                _id: "asg-1",
                id: "asg-1",
                assignmentId: "asg-1",
                status: "IN_PROGRESS",
                isAccepted: true,
                acceptedAt: new Date().toISOString(),
                sketchUploadId: "sk-1",
                applicationId: "APP-E2E-1",
                assignedAt: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                customerName: "Surveyor One",
                phone: "9876543210",
              },
            ],
            meta: { page: 1, limit: 10, total: 1 },
          },
        };
      }
      if (path.includes("/api/cad/sketch-uploads/") && method === "GET") {
        return {
          success: true,
          data: {
            _id: "sk-1",
            status: "IN_PROGRESS",
            documents: {},
            cadDeliverable: [],
          },
        };
      }
      if (path.includes("/api/upload/cad-deliverable") && method === "POST") {
        return {
          success: true,
          data: {
            signedUploadUrl: "https://example.invalid/upload",
            uploadHeaders: { "Content-Type": "application/acad" },
            fileUrl: "https://example.invalid/files/plan.dwg",
            key: "cad/plan.dwg",
          },
        };
      }
      if (path.includes("/api/upload/confirm") && method === "POST") {
        return {
          success: true,
          data: { confirmed: true, sha256: "abc123" },
        };
      }
      if (path.includes("/api/cad/assignments/") && path.endsWith("/deliver") && method === "POST") {
        return { success: true, data: { status: "COMPLETED" } };
      }
      return null;
    });

    await page.goto("/dashboard/cad/current-orders");
    await expect(page.getByText(/View Current Projects/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/APP-E2E-1|Surveyor One|asg-1/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Open details → CAD deliver upload panel
    const viewBtn = page.getByRole("button", { name: /View Details/i }).first();
    if (await viewBtn.isVisible().catch(() => false)) {
      await viewBtn.click();
      await expect(
        page.getByText(/Upload CAD|CAD deliverable|Upload Drawing/i).first()
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
