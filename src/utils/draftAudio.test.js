/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { audioFromDraft, resolvePlayableMediaUrl } from "./draftAudio.js";

describe("audioFromDraft", () => {
  it("returns null for empty input", () => {
    expect(audioFromDraft(null)).toBe(null);
    expect(audioFromDraft(undefined)).toBe(null);
  });

  it("maps private fileUrl without treating it as previewUrl", () => {
    const out = audioFromDraft({
      fileUrl: "https://bucket/private.webm",
      key: "k1",
      fileName: "voice.webm",
      mimeType: "audio/webm",
      size: 10,
    });
    expect(out.fileUrl).toBe("https://bucket/private.webm");
    expect(out.key).toBe("k1");
    expect(out.previewUrl).toBeUndefined();
  });

  it("maps downloadUrl / previewUrl into previewUrl for the player", () => {
    const out = audioFromDraft({
      fileUrl: "https://bucket/private.webm",
      downloadUrl: "https://bucket/private.webm?X-Amz-Signature=abc",
      downloadUrlExpiresAt: "2026-03-24T12:00:00.000Z",
    });
    expect(out.previewUrl).toBe("https://bucket/private.webm?X-Amz-Signature=abc");
    expect(out.downloadUrlExpiresAt).toBe("2026-03-24T12:00:00.000Z");
  });

  it("accepts signedUrl alias", () => {
    const out = audioFromDraft({
      url: "https://bucket/private.webm",
      signedUrl: "https://signed",
    });
    expect(out.previewUrl).toBe("https://signed");
  });
});

describe("resolvePlayableMediaUrl", () => {
  it("prefers previewUrl over private fileUrl", () => {
    expect(
      resolvePlayableMediaUrl({
        previewUrl: "https://signed",
        fileUrl: "https://private",
      })
    ).toBe("https://signed");
  });

  it("allows blob previewUrl", () => {
    expect(resolvePlayableMediaUrl({ previewUrl: "blob:http://local/1" })).toBe(
      "blob:http://local/1"
    );
  });

  it("does not fall back to private fileUrl", () => {
    expect(resolvePlayableMediaUrl({ fileUrl: "https://private" })).toBe(null);
    expect(resolvePlayableMediaUrl("https://private")).toBe(null);
  });
});
