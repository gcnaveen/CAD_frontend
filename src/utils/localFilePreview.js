/**
 * Local blob preview helpers for private S3 uploads (H-10).
 * After confirm, remote fileUrl may not be playable/viewable in <audio>/<img>/window.open.
 * Keep a session-local object URL for immediate preview.
 */

/**
 * @param {Blob | File | null | undefined} file
 * @returns {string | null}
 */
export function createLocalPreviewUrl(file) {
  if (!file || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return null;
  }
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} url
 */
export function revokeLocalPreviewUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

/**
 * Prefer local blob preview, then remote URL.
 * @param {{ previewUrl?: string, thumbUrl?: string, url?: string, fileUrl?: string } | string | null | undefined} item
 * @returns {string | null}
 */
export function resolvePreviewUrl(item) {
  if (!item) return null;
  if (typeof item === "string") return item || null;
  return (
    item.previewUrl ||
    item.thumbUrl ||
    item.url ||
    item.fileUrl ||
    null
  );
}
