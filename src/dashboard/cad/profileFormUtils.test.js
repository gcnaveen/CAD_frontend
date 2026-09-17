import { describe, expect, it } from "vitest";
import {
  IFSC_REGEX,
  PHONE_REGEX,
  fileNameFromUrl,
  isDocumentUploadField,
  isWordDocumentFile,
  normalizeIndianPhone,
  resolveProfilePhotoUrl,
  resolveUserEmail,
  sanitizeIfsc,
} from "./profileFormUtils.js";

describe("resolveUserEmail", () => {
  it("reads nested auth and personalDetails email", () => {
    expect(resolveUserEmail({ email: "a@x.com" })).toBe("a@x.com");
    expect(resolveUserEmail({ auth: { email: "b@x.com" } })).toBe("b@x.com");
    expect(resolveUserEmail({ personalDetails: { email: "c@x.com" } })).toBe("c@x.com");
  });
});

describe("normalizeIndianPhone", () => {
  it("keeps a 10-digit number", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
    expect(PHONE_REGEX.test(normalizeIndianPhone("9876543210"))).toBe(true);
  });

  it("strips +91, 91, spaces, and leading 0", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("919876543210")).toBe("9876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
  });

  it("rejects short numbers after normalize", () => {
    expect(PHONE_REGEX.test(normalizeIndianPhone("98765"))).toBe(false);
  });
});

describe("sanitizeIfsc", () => {
  it("uppercases, strips hyphens/spaces, and caps at 11", () => {
    expect(sanitizeIfsc("sbin-0001234")).toBe("SBIN0001234");
    expect(sanitizeIfsc(" SBIN 0001234 ")).toBe("SBIN0001234");
    expect(IFSC_REGEX.test(sanitizeIfsc("sbin-0001234"))).toBe(true);
  });

  it("treats letter O in position 5 as zero", () => {
    expect(sanitizeIfsc("SBINO001234")).toBe("SBIN0001234");
    expect(IFSC_REGEX.test(sanitizeIfsc("SBINO001234"))).toBe(true);
  });

  it("still rejects garbage", () => {
    expect(IFSC_REGEX.test(sanitizeIfsc("BANK"))).toBe(false);
    expect(IFSC_REGEX.test(sanitizeIfsc(""))).toBe(false);
  });
});

describe("document upload helpers", () => {
  it("routes resume and address proof as documents", () => {
    expect(isDocumentUploadField("resumeUrl")).toBe(true);
    expect(isDocumentUploadField("addressProofUrl")).toBe(true);
    expect(isDocumentUploadField("profilePhotoUrl")).toBe(false);
    expect(isDocumentUploadField("aadhaarPhotoUrl")).toBe(false);
  });

  it("detects Word files so they are not sent to the image API", () => {
    expect(isWordDocumentFile({ name: "cv.doc" })).toBe(true);
    expect(isWordDocumentFile({ name: "cv.docx" })).toBe(true);
    expect(isWordDocumentFile({ name: "cv.pdf", type: "application/pdf" })).toBe(false);
  });

  it("extracts a file name from a document URL", () => {
    expect(fileNameFromUrl("https://cdn.example/files/resume.pdf")).toBe("resume.pdf");
  });
});

describe("resolveProfilePhotoUrl", () => {
  it("reads nested personalDetails photo", () => {
    expect(
      resolveProfilePhotoUrl({ personalDetails: { profilePhotoUrl: "https://cdn.example/p.jpg" } })
    ).toBe("https://cdn.example/p.jpg");
  });
});
