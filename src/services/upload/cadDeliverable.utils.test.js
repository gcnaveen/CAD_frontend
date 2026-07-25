import { describe, expect, it } from "vitest";
import {
  getFileExtension,
  resolveCadDeliverableContentType,
  resolveCadDeliverableRole,
  validateCadDeliverableFiles,
  toCadDeliverFilePayload,
} from "./cadDeliverable.utils.js";

describe("cadDeliverable.utils (H-12)", () => {
  it("classifies source and preview by extension", () => {
    expect(resolveCadDeliverableRole({ name: "plan.dwg" })).toBe("source");
    expect(resolveCadDeliverableRole({ name: "plan.DXF" })).toBe("source");
    expect(resolveCadDeliverableRole({ name: "preview.pdf" })).toBe("preview");
    expect(resolveCadDeliverableRole({ name: "shot.png" })).toBe("preview");
    expect(resolveCadDeliverableRole({ name: "notes.txt" })).toBe(null);
  });

  it("resolves MIME when File.type is empty", () => {
    expect(getFileExtension("A.DWG")).toBe("dwg");
    expect(resolveCadDeliverableContentType({ name: "a.dwg", type: "" })).toBe(
      "application/acad"
    );
    expect(resolveCadDeliverableContentType({ name: "a.dxf", type: "" })).toBe(
      "application/dxf"
    );
  });

  it("rejects preview-only selections (CAD_SOURCE_REQUIRED)", () => {
    const result = validateCadDeliverableFiles([
      { name: "preview.pdf", type: "application/pdf", size: 100 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.code).toBe("CAD_SOURCE_REQUIRED");
  });

  it("accepts source plus optional preview", () => {
    const result = validateCadDeliverableFiles([
      { name: "plan.dwg", type: "", size: 1000 },
      { name: "preview.pdf", type: "application/pdf", size: 200 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.sources).toHaveLength(1);
    expect(result.previews).toHaveLength(1);
  });

  it("builds deliver payload with role, s3Key, sha256, confirmed", () => {
    expect(
      toCadDeliverFilePayload({
        fileUrl: "https://cdn/x.dwg",
        key: "k1",
        fileName: "x.dwg",
        mimeType: "application/acad",
        size: 10,
        role: "source",
        sha256: "deadbeef",
        confirmed: true,
      })
    ).toEqual({
      url: "https://cdn/x.dwg",
      fileName: "x.dwg",
      mimeType: "application/acad",
      size: 10,
      role: "source",
      s3Key: "k1",
      sha256: "deadbeef",
      confirmed: true,
    });
  });
});
