import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createLocalPreviewUrl,
  revokeLocalPreviewUrl,
  resolvePreviewUrl,
} from "./localFilePreview.js";

describe("localFilePreview", () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview-1");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createLocalPreviewUrl returns object URL for a Blob", () => {
    const blob = new Blob(["x"], { type: "audio/webm" });
    expect(createLocalPreviewUrl(blob)).toBe("blob:preview-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("createLocalPreviewUrl returns null for empty input", () => {
    expect(createLocalPreviewUrl(null)).toBeNull();
    expect(createLocalPreviewUrl(undefined)).toBeNull();
  });

  it("resolvePreviewUrl prefers local preview over remote fileUrl", () => {
    expect(
      resolvePreviewUrl({
        previewUrl: "blob:local",
        fileUrl: "https://s3.example/private.webm",
        url: "https://s3.example/private.webm",
      })
    ).toBe("blob:local");
  });

  it("resolvePreviewUrl falls back to remote url", () => {
    expect(
      resolvePreviewUrl({
        fileUrl: "https://s3.example/a.png",
      })
    ).toBe("https://s3.example/a.png");
  });

  it("revokeLocalPreviewUrl only revokes blob URLs", () => {
    revokeLocalPreviewUrl("blob:preview-1");
    revokeLocalPreviewUrl("https://s3.example/a.png");
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });
});
