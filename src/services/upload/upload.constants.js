/**
 * Upload module constants: allowed file types and max sizes.
 */

/** Allowed image extensions (lowercase) */
export const IMAGE_EXTENSIONS = ["jpeg", "jpg", "png", "gif", "webp"];

/** Allowed image MIME types */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Max image file size in bytes (10 MB) */
export const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Human-readable max image size */
export const IMAGE_MAX_SIZE_LABEL = "10MB";

/** Allowed audio extensions (lowercase) */
export const AUDIO_EXTENSIONS = ["mpeg", "mp3", "wav", "webm", "ogg", "m4a"];

/** Allowed audio MIME types */
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

/** Max audio file size in bytes (25 MB) */
export const AUDIO_MAX_SIZE_BYTES = 25 * 1024 * 1024;

/** Human-readable max audio size */
export const AUDIO_MAX_SIZE_LABEL = "25MB";

/** H-12: CAD source deliverable extensions (required for deliver) */
export const CAD_SOURCE_EXTENSIONS = ["dwg", "dxf"];

/** H-12: optional preview extensions */
export const CAD_PREVIEW_EXTENSIONS = [
  "pdf",
  "jpeg",
  "jpg",
  "png",
  "gif",
  "webp",
];

/** Accept string for CAD deliver Upload controls */
export const CAD_DELIVERABLE_ACCEPT =
  ".dwg,.dxf,.pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp";

/** Default MIME when the browser leaves File.type empty */
export const CAD_EXTENSION_MIME = {
  dwg: "application/acad",
  dxf: "application/dxf",
  pdf: "application/pdf",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/** Max CAD deliverable size (single or multipart) — 200 MB */
export const CAD_DELIVERABLE_MAX_SIZE_BYTES = 200 * 1024 * 1024;

export const CAD_DELIVERABLE_MAX_SIZE_LABEL = "200MB";

/**
 * Files at or above this size use multipart upload (S3 part min is 5MB except last).
 * Default part size matches this threshold.
 */
export const CAD_DELIVERABLE_MULTIPART_THRESHOLD_BYTES = 8 * 1024 * 1024;

export const CAD_DELIVERABLE_PART_SIZE_BYTES = 8 * 1024 * 1024;
