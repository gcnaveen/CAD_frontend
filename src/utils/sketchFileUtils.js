/**
 * Normalize API file fields that may be a single object, an array, or empty.
 * @param {object|object[]|null|undefined} value
 * @returns {Array<{ url: string, fileName?: string, mimeType?: string, size?: number, uploadedAt?: string }>}
 */
export function normalizeFileList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((file) => file && file.url);
  }
  if (typeof value === "object" && value.url) {
    return [value];
  }
  return [];
}

/** @param {object|object[]|null|undefined} value */
export function normalizeSingleFile(value) {
  return normalizeFileList(value)[0] ?? null;
}

/** @param {object|object[]|null|undefined} value */
export function hasUploadedFiles(value) {
  return normalizeFileList(value).length > 0;
}

/**
 * Normalize documents map where each key may hold one file or many.
 * @param {Record<string, object|object[]>|null|undefined} documents
 * @returns {Record<string, object[]>}
 */
export function normalizeDocumentsMap(documents) {
  if (!documents || typeof documents !== "object" || Array.isArray(documents)) {
    return {};
  }
  const result = {};
  for (const [key, value] of Object.entries(documents)) {
    const files = normalizeFileList(value);
    if (files.length) result[key] = files;
  }
  return result;
}

/** @param {Record<string, object|object[]>|null|undefined} documents */
export function documentsMapHasAny(documents) {
  return Object.keys(normalizeDocumentsMap(documents)).length > 0;
}

/**
 * Flatten documents map into labeled file rows for list UIs.
 * @param {Record<string, object|object[]>} documents
 * @param {Record<string, string>} [labelMap]
 */
/**
 * Download a remote file without navigating away from the SPA.
 * @param {string} url
 * @param {string} [fileName]
 */
export async function downloadRemoteFile(url, fileName = "download") {
  if (!url) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function flattenDocumentEntries(documents, labelMap = {}) {
  const map = normalizeDocumentsMap(documents);
  return Object.entries(map).flatMap(([key, files]) =>
    files.map((file, index) => ({
      key: `${key}-${index}`,
      docKey: key,
      label: labelMap[key] || key,
      file,
      fileIndex: index,
      fileCount: files.length,
    }))
  );
}
