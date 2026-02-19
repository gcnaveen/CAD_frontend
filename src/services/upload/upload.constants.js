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
