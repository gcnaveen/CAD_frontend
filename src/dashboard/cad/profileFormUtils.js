/** Shared CAD complete-profile / edit-profile field helpers. */

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
export const ACCOUNT_NUMBER_REGEX = /^\d+$/;
export const PHONE_REGEX = /^\d{10}$/;

export const IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const DOCUMENT_UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

const DOCUMENT_FIELDS = new Set(["resumeUrl", "addressProofUrl"]);
const WORD_MIME = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function resolveUserEmail(user) {
  return String(
    user?.email || user?.auth?.email || user?.personalDetails?.email || ""
  ).trim();
}

export function resolveUserPhone(user) {
  return normalizeIndianPhone(
    user?.phone || user?.auth?.phone || user?.personalDetails?.phone || ""
  );
}

export function resolveProfilePhotoUrl(user) {
  return String(
    user?.profilePhotoUrl || user?.personalDetails?.profilePhotoUrl || ""
  ).trim();
}

/** Digits-only 10-digit Indian mobile. Strips +91 / 91 / leading 0. */
export function normalizeIndianPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(-10);
  return digits.slice(-10);
}

/**
 * IFSC: uppercase, strip separators, letter-O at position 5 → 0, cap at 11.
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeIfsc(raw) {
  let s = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (s.length >= 5 && s[4] === "O") {
    s = `${s.slice(0, 4)}0${s.slice(5)}`;
  }
  return s.slice(0, 11);
}

export function isDocumentUploadField(fieldName) {
  return DOCUMENT_FIELDS.has(fieldName);
}

export function isWordDocumentFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return name.endsWith(".doc") || name.endsWith(".docx") || WORD_MIME.has(type);
}

export function fileNameFromUrl(url) {
  if (!url || typeof url !== "string") return "Uploaded file";
  try {
    const path = new URL(url, "https://example.invalid").pathname;
    const last = path.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : "Uploaded file";
  } catch {
    return "Uploaded file";
  }
}

export function isImageFileUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("blob:") || url.startsWith("data:image/")) return true;
  return /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(url);
}
