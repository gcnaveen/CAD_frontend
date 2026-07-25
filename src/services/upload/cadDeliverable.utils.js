import {
  CAD_DELIVERABLE_MAX_SIZE_BYTES,
  CAD_DELIVERABLE_MAX_SIZE_LABEL,
  CAD_EXTENSION_MIME,
  CAD_PREVIEW_EXTENSIONS,
  CAD_SOURCE_EXTENSIONS,
} from "./upload.constants.js";

/**
 * @param {string} fileName
 * @returns {string} lowercase extension without dot
 */
export function getFileExtension(fileName) {
  const name = String(fileName || "").trim();
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Resolve MIME for CAD deliverables (browsers often omit type for .dwg/.dxf).
 * @param {File | { name?: string, type?: string }} file
 * @returns {string}
 */
export function resolveCadDeliverableContentType(file) {
  const fromBrowser = String(file?.type || "").trim();
  if (fromBrowser) return fromBrowser;
  const ext = getFileExtension(file?.name);
  return CAD_EXTENSION_MIME[ext] || "application/octet-stream";
}

/**
 * H-12 role from filename: source (.dwg/.dxf) or preview (.pdf/image).
 * @param {File | { name?: string, type?: string }} file
 * @returns {"source" | "preview" | null}
 */
export function resolveCadDeliverableRole(file) {
  const ext = getFileExtension(file?.name);
  if (CAD_SOURCE_EXTENSIONS.includes(ext)) return "source";
  if (CAD_PREVIEW_EXTENSIONS.includes(ext)) return "preview";

  const mime = String(file?.type || "").toLowerCase();
  if (mime === "application/pdf" || mime.startsWith("image/")) return "preview";
  if (
    mime.includes("dwg") ||
    mime.includes("dxf") ||
    mime === "application/acad"
  ) {
    return "source";
  }
  return null;
}

/**
 * Client-side validation before CAD deliver upload.
 * @param {File[]} files
 * @returns {{ valid: boolean, error?: string, sources: File[], previews: File[] }}
 */
export function validateCadDeliverableFiles(files) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) {
    return {
      valid: false,
      error: "Please select at least one CAD file to deliver.",
      sources: [],
      previews: [],
    };
  }

  const sources = [];
  const previews = [];

  for (const file of list) {
    const role = resolveCadDeliverableRole(file);
    if (!role) {
      return {
        valid: false,
        error: `${file.name}: only .dwg/.dxf (source) and optional .pdf/image (preview) are allowed.`,
        sources,
        previews,
      };
    }
    if ((Number(file.size) || 0) > CAD_DELIVERABLE_MAX_SIZE_BYTES) {
      return {
        valid: false,
        error: `${file.name}: file too large. Maximum size is ${CAD_DELIVERABLE_MAX_SIZE_LABEL}.`,
        sources,
        previews,
      };
    }
    if (role === "source") sources.push(file);
    else previews.push(file);
  }

  if (!sources.length) {
    return {
      valid: false,
      error:
        "At least one source .dwg or .dxf file is required. PDF/image alone cannot be delivered.",
      code: "CAD_SOURCE_REQUIRED",
      sources,
      previews,
    };
  }

  return { valid: true, sources, previews };
}

/**
 * Build deliver API file entry from a confirmed CAD upload.
 * @param {{
 *   fileUrl: string,
 *   key: string,
 *   fileName: string,
 *   mimeType: string,
 *   size: number,
 *   role: "source" | "preview",
 *   sha256?: string,
 *   confirmed?: boolean,
 * }} uploaded
 */
export function toCadDeliverFilePayload(uploaded) {
  return {
    url: uploaded.fileUrl,
    fileName: uploaded.fileName,
    mimeType: uploaded.mimeType,
    size: uploaded.size,
    role: uploaded.role,
    s3Key: uploaded.key,
    sha256: uploaded.sha256,
    confirmed: uploaded.confirmed !== false,
  };
}
