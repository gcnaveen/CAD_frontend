/**
 * Normalize sketch-draft / order audio from API into form + player shape.
 * Private `fileUrl` alone is not playable after H-10; prefer signed preview fields.
 */

/**
 * @param {unknown} raw
 * @returns {{
 *   fileUrl: string,
 *   url: string,
 *   key?: string,
 *   fileName: string,
 *   mimeType: string,
 *   size: number,
 *   previewUrl?: string,
 *   downloadUrlExpiresAt?: string,
 * } | null}
 */
export function audioFromDraft(raw) {
  if (!raw) return null;
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item) return null;

  if (typeof item === "string") {
    return { fileUrl: item, url: item, fileName: "audio", mimeType: "audio/mpeg", size: 0 };
  }

  const url = item.url || item.fileUrl || item.fileURL || null;
  const playable =
    item.previewUrl ||
    item.downloadUrl ||
    item.signedUrl ||
    item.signedDownloadUrl ||
    null;

  if (!url && !playable) return null;

  const fileUrl = url || playable;
  const out = {
    fileUrl,
    url: fileUrl,
    key: item.key || undefined,
    fileName: item.fileName || item.name || "audio",
    mimeType: item.mimeType || item.type || "audio/mpeg",
    size: item.size || 0,
  };

  if (playable) {
    out.previewUrl = playable;
  }
  if (item.downloadUrlExpiresAt || item.expiresAt) {
    out.downloadUrlExpiresAt = item.downloadUrlExpiresAt || item.expiresAt;
  }
  return out;
}

/**
 * Playable src for <audio>/<video>: blob or signed preview only — not private fileUrl.
 * @param {{ previewUrl?: string, downloadUrl?: string, signedUrl?: string, thumbUrl?: string, url?: string, fileUrl?: string } | string | null | undefined} item
 * @returns {string | null}
 */
export function resolvePlayableMediaUrl(item) {
  if (!item) return null;
  if (typeof item === "string") {
    if (item.startsWith("blob:")) return item;
    // Bare remote strings from drafts are private after H-10 — not treated as playable.
    return null;
  }
  const playable =
    item.previewUrl ||
    item.downloadUrl ||
    item.signedUrl ||
    item.signedDownloadUrl ||
    null;
  if (playable) return playable;
  if (typeof item.thumbUrl === "string" && item.thumbUrl.startsWith("blob:")) {
    return item.thumbUrl;
  }
  return null;
}
