import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const PRICING = {
  success: true,
  data: {
    upload: { planAmountRupees: 100, discountRupees: 0, feePaise: 0, payableRupees: 100 },
    revision: { planAmountRupees: 50, discountRupees: 0, feePaise: 0 },
    gstAmountRupees: 0,
    superimposeAddOnRupees: 0,
  },
};

function masterList(items) {
  return { success: true, data: items };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ draft?: object, onSketchCreate?: (body: object) => void, onDraftWrite?: (body: object) => void }} [opts]
 */
async function stubSurveyorUploadApis(page, opts = {}) {
  const draftWrites = [];
  let uploadSeq = 0;

  await page.route("https://e2e-upload.example/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await stubApi(page, (path, method, req) => {
    if (path.includes("/api/surveyor/sketch-pricing") && method === "GET") return PRICING;

    if (path.includes("/api/masters/districts") && path.includes("/talukas")) {
      return masterList([{ _id: "tal-1", name: "Anekal", status: "ACTIVE" }]);
    }
    if (path.includes("/api/masters/districts") && method === "GET") {
      return masterList([{ _id: "dist-1", name: "Bengaluru", status: "ACTIVE" }]);
    }
    if (path.includes("/hoblis") && method === "GET") {
      return masterList([{ _id: "hob-1", name: "Attibele", status: "ACTIVE" }]);
    }
    if (path.includes("/api/masters/villages") && method === "GET") {
      return masterList([{ _id: "vil-1", name: "Yadavanahalli", status: "ACTIVE" }]);
    }

    if (path.includes("/api/upload/image") || path.includes("/api/upload/document")) {
      uploadSeq += 1;
      return {
        success: true,
        data: {
          signedUploadUrl: `https://e2e-upload.example/put-${uploadSeq}`,
          fileUrl: `https://cdn.example/files/doc-${uploadSeq}.png`,
          key: `uploads/doc-${uploadSeq}.png`,
        },
      };
    }
    if (path.includes("/api/upload/confirm")) {
      return {
        success: true,
        data: {
          confirmed: true,
          fileUrl: `https://cdn.example/files/doc-${uploadSeq}.png`,
          key: `uploads/doc-${uploadSeq}.png`,
        },
      };
    }
    if (path.includes("/api/upload/delete")) {
      return { success: true, data: { deleted: true } };
    }

    if (path === "/api/surveyor/sketch-drafts" && method === "POST") {
      const body = req.postDataJSON?.() || {};
      draftWrites.push(body);
      opts.onDraftWrite?.(body);
      return { success: true, data: { _id: "draft-e2e-1" } };
    }
    if (path.match(/\/api\/surveyor\/sketch-drafts\/[^/]+$/) && method === "PATCH") {
      const body = req.postDataJSON?.() || {};
      draftWrites.push(body);
      opts.onDraftWrite?.(body);
      return { success: true, data: { _id: "draft-e2e-1", ...body } };
    }
    if (path.match(/\/api\/surveyor\/sketch-drafts\/[^/]+$/) && method === "GET") {
      return { success: true, data: opts.draft || { _id: "draft-e2e-1" } };
    }

    if (path === "/api/surveyor/sketch-uploads" && method === "POST") {
      const body = req.postDataJSON?.() || {};
      opts.onSketchCreate?.(body);
      return {
        success: true,
        data: { _id: "upload-e2e-1" },
        meta: { payment: { requiresPayment: false } },
      };
    }

    return null;
  });

  return { draftWrites };
}

async function pickAntOption(page, placeholder, optionText) {
  await page.getByText(placeholder, { exact: true }).click();
  const option = page.locator(".ant-select-item-option-content", { hasText: optionText });
  await option.first().click();
}

async function fillLocationAndContinue(page) {
  await page.getByRole("button", { name: /Single Sketch/i }).click();
  await pickAntOption(page, "Select district", "Bengaluru");
  await pickAntOption(page, "Select taluka", "Anekal");
  await pickAntOption(page, "Select hobli", "Attibele");
  await pickAntOption(page, "Select village", "Yadavanahalli");
  await page.getByPlaceholder("e.g. 42/3").fill("42/3");
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(page.getByText("Drawing Details").or(page.getByText("Google Map"))).toBeVisible({
    timeout: 20_000,
  });
}

async function continueDrawingWithoutSuperimpose(page) {
  await page.getByRole("button", { name: /^Continue/ }).click();
  const anyway = page.getByRole("button", { name: /Continue Anyway/i });
  if (await anyway.isVisible({ timeout: 4000 }).catch(() => false)) {
    await anyway.click();
  }
  await expect(page.getByRole("button", { name: "Normal Upload" })).toBeVisible({
    timeout: 20_000,
  });
}

function docRow(page, title) {
  return page.locator("div.rounded-2xl.border").filter({ hasText: title }).first();
}

async function enableAndUpload(page, title, fileName) {
  const row = docRow(page, title);
  await row.getByRole("checkbox").check();
  const fileInput = row.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await expect(page.getByText("Uploaded successfully").last()).toBeVisible({ timeout: 20_000 });
}

async function goToDocuments(page) {
  await page.goto("/dashboard/user/upload");
  await expect(page.getByText("New Request")).toBeVisible({ timeout: 20_000 });
  await fillLocationAndContinue(page);
  await continueDrawingWithoutSuperimpose(page);
}

test.describe("Surveyor documents mode switch", () => {
  test("clears other documents when switching normal → single and submit is not blocked", async ({
    page,
  }) => {
    /** @type {object | null} */
    let sketchPayload = null;
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubSurveyorUploadApis(page, {
      onSketchCreate: (body) => {
        sketchPayload = body;
      },
    });

    await goToDocuments(page);

    await enableAndUpload(page, "Moola Tippani", "moola.png");
    await enableAndUpload(page, "Others", "other.png");
    await expect(docRow(page, "Others").getByText("other.png")).toBeVisible();

    await page.getByRole("button", { name: "Single Upload" }).click();
    await expect(page.getByText("Switch upload mode?")).toBeVisible();
    await page.getByRole("button", { name: "Switch & clear" }).click();

    await expect(page.getByText("Tap to upload")).toBeVisible();
    await expect(page.getByText("other.png")).toHaveCount(0);

    const singleInput = page.locator('input[type="file"]').first();
    await singleInput.setInputFiles({
      name: "single.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(page.getByText("Uploaded successfully").last()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("checkbox", { name: /Moola Tippani/i }).check();

    await page.getByRole("button", { name: /^Continue/ }).click();
    await expect(page.getByText("Review & Submit")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Other Docs")).toHaveCount(0);

    await page.getByRole("button", { name: /Submit Order/i }).click();
    await expect(page.getByText("Other documents still uploading")).toHaveCount(0);
    await expect.poll(() => sketchPayload).not.toBeNull();
    expect(sketchPayload.uploadMode).toBe("single");
    expect(sketchPayload.other_documents).toBeUndefined();
    expect(sketchPayload.moolaTippani).toBeUndefined();
    expect(sketchPayload.singleUpload?.url).toMatch(/^https:\/\//);
  });

  test("others-only switch shows confirm and does not resurrect files when returning to normal", async ({
    page,
  }) => {
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubSurveyorUploadApis(page);
    await goToDocuments(page);

    await enableAndUpload(page, "Others", "only-other.png");
    await page.getByRole("button", { name: "Single Upload" }).click();
    await expect(page.getByText("Switch upload mode?")).toBeVisible();
    await page.getByRole("button", { name: "Switch & clear" }).click();
    await expect(page.getByText("Tap to upload")).toBeVisible();

    await page.getByRole("button", { name: "Normal Upload" }).click();
    await expect(docRow(page, "Others")).toBeVisible();
    await expect(page.getByText("only-other.png")).toHaveCount(0);
    await expect(docRow(page, "Others").getByText("Select the checkbox to enable upload")).toBeVisible();
  });

  test("canceling mode switch keeps other documents", async ({ page }) => {
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubSurveyorUploadApis(page);
    await goToDocuments(page);

    await enableAndUpload(page, "Moola Tippani", "moola.png");
    await enableAndUpload(page, "Others", "keep-other.png");
    await page.getByRole("button", { name: "Single Upload" }).click();
    await expect(page.getByText("Switch upload mode?")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("button", { name: "Normal Upload" })).toBeVisible();
    await expect(docRow(page, "Others").getByText("keep-other.png")).toBeVisible();
    await expect(docRow(page, "Moola Tippani").getByText("moola.png")).toBeVisible();
  });

  test("single-mode draft does not rehydrate leftover other documents", async ({ page }) => {
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubSurveyorUploadApis(page, {
      draft: {
        _id: "draft-single-ghost",
        uploadMode: "single",
        surveyType: "single_flat",
        surveyNo: "99/1",
        district: { _id: "dist-1", name: "Bengaluru" },
        taluka: { _id: "tal-1", name: "Anekal" },
        hobli: { _id: "hob-1", name: "Attibele" },
        village: { _id: "vil-1", name: "Yadavanahalli" },
        singleUpload: {
          url: "https://cdn.example/files/single.png",
          fileName: "single.png",
          mimeType: "image/png",
          size: 12,
        },
        is_originaltippani: true,
        other_documents: [
          {
            url: "https://cdn.example/files/ghost.png",
            fileName: "ghost.png",
            mimeType: "image/png",
            size: 12,
          },
        ],
      },
    });

    await page.goto("/dashboard/user/upload?draftId=draft-single-ghost");
    await expect(page.getByText("New Request")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^Continue/ }).click();
    await continueDrawingWithoutSuperimpose(page);

    await expect(page.getByText("Tap to upload")).toBeVisible();
    await expect(page.getByText("ghost.png")).toHaveCount(0);

    await page.getByRole("button", { name: "Normal Upload" }).click();
    await expect(docRow(page, "Others")).toBeVisible();
    await expect(page.getByText("ghost.png")).toHaveCount(0);
  });

  test("normal-mode review lists other docs and submit includes them", async ({ page }) => {
    /** @type {object | null} */
    let sketchPayload = null;
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    await stubSurveyorUploadApis(page, {
      onSketchCreate: (body) => {
        sketchPayload = body;
      },
    });

    await goToDocuments(page);
    await enableAndUpload(page, "Moola Tippani", "moola.png");
    await enableAndUpload(page, "Others", "extra.png");

    await page.getByRole("button", { name: /^Continue/ }).click();
    await expect(page.getByText("Review & Submit")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Other Docs")).toBeVisible();
    await expect(page.getByText("1 file(s)")).toBeVisible();

    await page.getByRole("button", { name: /Submit Order/i }).click();
    await expect(page.getByText("Other documents still uploading")).toHaveCount(0);
    await expect.poll(() => sketchPayload).not.toBeNull();
    expect(sketchPayload.uploadMode).toBe("normal");
    expect(Array.isArray(sketchPayload.other_documents)).toBe(true);
    expect(sketchPayload.other_documents.length).toBe(1);
    expect(sketchPayload.singleUpload).toBeUndefined();
  });
});
