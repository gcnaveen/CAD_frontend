import { test, expect } from "@playwright/test";
import { seedAuth, stubApi } from "./helpers.js";

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
 */
async function stubSurveyorUploadApis(page) {
  const draftWrites = [];

  await page.addInitScript(() => {
    class FakeMediaRecorder {
      constructor() {
        this.state = "inactive";
        this.mimeType = "audio/webm";
        this.ondataavailable = null;
        this.onstop = null;
      }
      start() {
        this.state = "recording";
      }
      requestData() {
        const bytes = new Uint8Array(256);
        bytes[0] = 0x1a;
        bytes[1] = 0x45;
        bytes[2] = 0xdf;
        bytes[3] = 0xa3;
        this.ondataavailable?.({ data: new Blob([bytes], { type: "audio/webm" }) });
      }
      stop() {
        this.state = "inactive";
        this.requestData();
        this.onstop?.();
      }
    }
    FakeMediaRecorder.isTypeSupported = () => true;
    window.MediaRecorder = FakeMediaRecorder;
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => ({
        getTracks: () => [{ stop() {} }],
      });
    } else {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        },
      });
    }
  });

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

    if (path.includes("/api/upload/audio") && method === "POST") {
      return {
        success: true,
        data: {
          signedUploadUrl: "https://e2e-upload.example/audio-put",
          fileUrl: "https://cdn.example/files/voice.webm",
          key: "uploads/voice.webm",
        },
      };
    }
    if (path.includes("/api/upload/confirm")) {
      return {
        success: true,
        data: {
          confirmed: true,
          fileUrl: "https://cdn.example/files/voice.webm",
          key: "uploads/voice.webm",
        },
      };
    }

    if (path === "/api/surveyor/sketch-drafts" && method === "POST") {
      const body = req.postDataJSON?.() || {};
      draftWrites.push(body);
      return { success: true, data: { _id: "draft-e2e-1" } };
    }
    if (path.match(/\/api\/surveyor\/sketch-drafts\/[^/]+$/) && method === "PATCH") {
      const body = req.postDataJSON?.() || {};
      draftWrites.push(body);
      return { success: true, data: { _id: "draft-e2e-1", ...body } };
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
  await expect(page.getByText("Drawing Details")).toBeVisible({ timeout: 20_000 });
}

test.describe("Drawing voice note auto-save on Continue", () => {
  test("saves a stopped recording when Continue is clicked without Save Recording", async ({
    page,
  }) => {
    await seedAuth(page, { role: "SURVEYOR", name: "Surveyor" });
    const { draftWrites } = await stubSurveyorUploadApis(page);

    await page.goto("/dashboard/user/upload");
    await expect(page.getByText("New Request")).toBeVisible({ timeout: 20_000 });
    await fillLocationAndContinue(page);

    await page.getByRole("button", { name: /Record Audio/i }).click();
    await expect(page.getByText("Recording")).toBeVisible();
    await page.getByRole("button", { name: /^Stop$/ }).click();
    await expect(page.getByRole("button", { name: /Save Recording/i })).toBeVisible();

    await page.getByRole("button", { name: /^Continue/ }).click();
    await expect(page.getByText("Audio uploaded")).toBeVisible({ timeout: 20_000 });
    const anyway = page.getByRole("button", { name: /Continue Anyway/i });
    if (await anyway.isVisible({ timeout: 4000 }).catch(() => false)) {
      await anyway.click();
    }
    await expect(page.getByRole("button", { name: "Normal Upload" })).toBeVisible({
      timeout: 20_000,
    });

    const withAudio = draftWrites.find((body) => body?.audio?.fileUrl || body?.audio?.url);
    expect(withAudio?.audio?.fileUrl || withAudio?.audio?.url).toMatch(/^https:\/\//);
  });
});
