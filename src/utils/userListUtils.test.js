import { describe, expect, it } from "vitest";
import { mapUserToRow, resolveResumeUrl } from "./userListUtils.js";

describe("resolveResumeUrl", () => {
  it("reads top-level resumeUrl", () => {
    expect(resolveResumeUrl({ resumeUrl: " https://cdn.example/r.pdf " })).toBe(
      "https://cdn.example/r.pdf"
    );
  });

  it("reads nested professionalDetails.resumeUrl", () => {
    expect(
      resolveResumeUrl({ professionalDetails: { resumeUrl: "https://cdn.example/cv.docx" } })
    ).toBe("https://cdn.example/cv.docx");
  });

  it("prefers top-level over nested", () => {
    expect(
      resolveResumeUrl({
        resumeUrl: "https://cdn.example/top.pdf",
        professionalDetails: { resumeUrl: "https://cdn.example/nested.pdf" },
      })
    ).toBe("https://cdn.example/top.pdf");
  });

  it("returns empty string when missing", () => {
    expect(resolveResumeUrl(null)).toBe("");
    expect(resolveResumeUrl({})).toBe("");
  });
});

describe("mapUserToRow resumeUrl", () => {
  it("flattens professionalDetails.resumeUrl onto the row", () => {
    const row = mapUserToRow({
      _id: "1",
      name: { first: "Ada", last: "Lovelace" },
      auth: { email: "ada@example.com", phone: "9999999999" },
      professionalDetails: { resumeUrl: "https://cdn.example/ada.pdf" },
    });
    expect(row.resumeUrl).toBe("https://cdn.example/ada.pdf");
  });
});
