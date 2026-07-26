import {
  getImagePresignedUrl,
  getAudioPresignedUrl,
  getCadDeliverablePresignedUrl,
  startCadDeliverableMultipart,
  getCadDeliverableMultipartPart,
  completeCadDeliverableMultipart,
  confirmUpload,
  deleteUploadedFile,
} from "./upload.api.js";
import {
  QuarantinedFileError,
  UploadAuthRequiredError,
  isFileQuarantined,
} from "./upload.errors.js";
import {
  CAD_DELIVERABLE_MULTIPART_THRESHOLD_BYTES,
  CAD_DELIVERABLE_PART_SIZE_BYTES,
} from "./upload.constants.js";
import {
  resolveCadDeliverableContentType,
  resolveCadDeliverableRole,
} from "./cadDeliverable.utils.js";
import { getStoredAccessToken } from "../../utils/authToken.js";

/**
 * H-10: strip MediaRecorder codec params and normalize webm variants.
 * `audio/webm;codecs=opus` / `video/webm` → `audio/webm` (S3 PUT must not send `;codecs=`).
 * @param {string} [mime]
 * @returns {string}
 */
export function normalizeUploadContentType(mime) {
  const raw = String(mime || "").trim();
  if (!raw) return "application/octet-stream";
  const base = raw.split(";")[0].trim().toLowerCase();
  if (base === "video/webm" || base === "audio/webm") return "audio/webm";
  return base || "application/octet-stream";
}

/**
 * Ensure fileName has an extension when content type implies one (voice notes).
 * @param {string} fileName
 * @param {string} contentType
 * @returns {string}
 */
export function ensureUploadFileName(fileName, contentType) {
  const name = String(fileName || "file").trim() || "file";
  if (/\.[a-z0-9]+$/i.test(name)) return name;
  const ct = normalizeUploadContentType(contentType);
  if (ct === "audio/webm") return `${name}.webm`;
  if (ct === "audio/mp4" || ct === "audio/x-m4a") return `${name}.m4a`;
  if (ct === "audio/ogg") return `${name}.ogg`;
  if (ct === "audio/wav") return `${name}.wav`;
  if (ct === "audio/mpeg" || ct === "audio/mp3") return `${name}.mp3`;
  if (ct.startsWith("image/")) {
    const ext = ct.slice("image/".length).replace("jpeg", "jpg");
    if (ext) return `${name}.${ext}`;
  }
  return name;
}

/**
 * Build a voice-note File with base MIME (no `;codecs=`) for H-10 audio presign.
 * @param {Blob} blob
 * @param {string} [fileName]
 * @returns {File}
 */
export function toVoiceNoteFile(blob, fileName) {
  const contentType = normalizeUploadContentType(
    blob?.type || "audio/webm"
  );
  const name = ensureUploadFileName(
    fileName || `voice-${Date.now()}.webm`,
    contentType
  );
  return new File([blob], name, { type: contentType });
}

/**
 * H-10: every image/audio/cad-deliverable/confirm call needs a Bearer token.
 */
function assertUploadAuth() {
  if (!getStoredAccessToken()) {
    throw new UploadAuthRequiredError();
  }
}

/**
 * Headers for browser PUT to a presigned S3 URL.
 * Must match the signed Content-Type exactly (from uploadHeaders).
 * Never send Authorization, Cookie, or extra x-amz-* (incl. SSE) — those break SigV4.
 * Do not fall back to blob.type when it includes `;codecs=` — that causes S3 403.
 * @param {Blob | File} body
 * @param {Record<string, string>} [uploadHeaders]
 * @returns {Record<string, string>}
 */
export function buildS3PutHeaders(body, uploadHeaders) {
  const headers = {};
  if (uploadHeaders && typeof uploadHeaders === "object") {
    for (const [k, v] of Object.entries(uploadHeaders)) {
      if (v == null || v === "") continue;
      const key = String(k);
      const lower = key.toLowerCase();
      if (lower === "authorization" || lower === "cookie") continue;
      if (lower.startsWith("x-amz-")) continue;
      headers[key] = String(v);
    }
  }
  const hasContentType = Object.keys(headers).some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (!hasContentType && body?.type) {
    headers["Content-Type"] = normalizeUploadContentType(body.type);
  }
  return headers;
}

/**
 * Content-Type actually sent on the S3 PUT (for confirm payload).
 * @param {Record<string, string>} headers
 * @param {string} [fallback]
 */
function contentTypeFromPutHeaders(headers, fallback) {
  for (const [k, v] of Object.entries(headers || {})) {
    if (k.toLowerCase() === "content-type" && v) return String(v);
  }
  return fallback || "application/octet-stream";
}

/**
 * Upload a file to S3 using a presigned URL (no AWS SDK).
 * Uses exact uploadHeaders from the backend when provided.
 * @param {string} uploadUrl
 * @param {Blob | File} body
 * @param {Record<string, string>} [uploadHeaders]
 * @returns {Promise<{ etag?: string }>}
 */
async function putFileToS3(uploadUrl, body, uploadHeaders) {
  const headers = buildS3PutHeaders(body, uploadHeaders);

  const redactedUploadUrl =
    typeof uploadUrl === "string" ? uploadUrl.split("?")[0] : uploadUrl;

  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body,
      headers,
    });

    if (!res.ok) {
      let details = "";
      try {
        details = await res.text();
      } catch {
        // ignore
      }

      console.error("s3 backend log", {
        uploadUrl: redactedUploadUrl,
        fileName: body?.name,
        contentType: headers["Content-Type"] || body?.type,
        status: res.status,
        statusText: res.statusText,
        responseBody: typeof details === "string" ? details : "",
      });

      const trimmed = typeof details === "string" ? details.slice(0, 300) : "";
      throw new Error(
        `S3 PUT failed (${res.status} ${res.statusText}) ${trimmed}`.trim()
      );
    }

    const rawEtag =
      res.headers.get("ETag") ||
      res.headers.get("etag") ||
      res.headers.get("Etag");
    const etag = rawEtag ? String(rawEtag).replace(/"/g, "") : undefined;
    return { etag };
  } catch (err) {
    console.error("s3 backend log", {
      uploadUrl: redactedUploadUrl,
      fileName: body?.name,
      contentType: headers["Content-Type"] || body?.type,
      error: err?.message || String(err),
    });
    throw err;
  }
}

/**
 * Normalize confirm / multipart-complete result.
 * @param {unknown} result
 * @returns {{ confirmed: boolean, sha256?: string, fileUrl?: string, key?: string }}
 */
function normalizeConfirmResult(result) {
  const body = result?.data ?? result ?? {};
  if (isFileQuarantined(body) || isFileQuarantined(result)) {
    throw new QuarantinedFileError(
      body?.message ||
        result?.message ||
        "This file was blocked by security scanning and cannot be attached."
    );
  }

  const confirmed =
    body.confirmed === true ||
    body.confirmed === "true" ||
    body.status === "confirmed" ||
    body.ok === true;

  return {
    confirmed: confirmed || Boolean(body.sha256),
    sha256: body.sha256 || body.checksumSha256 || body.hash,
    fileUrl: body.fileUrl || body.url,
    key: body.key || body.s3Key,
  };
}

/**
 * H-07: after S3 PUT, confirm with backend. On FILE_QUARANTINED, throw — callers must not attach URL.
 * @param {{ key: string, contentType: string, fileName: string, fileSizeBytes?: number }} params
 */
async function confirmUploadedFile({
  key,
  contentType,
  fileName,
  fileSizeBytes,
}) {
  if (!key) {
    throw new Error("Upload confirm failed: missing key");
  }

  try {
    const payload = {
      key,
      contentType: contentType || "application/octet-stream",
      fileName: fileName || "file",
    };
    if (fileSizeBytes != null) {
      payload.fileSizeBytes = Number(fileSizeBytes) || 0;
    }

    const result = await confirmUpload(payload);

    if (isFileQuarantined(result)) {
      throw new QuarantinedFileError(
        result?.message ||
          "This file was blocked by security scanning and cannot be attached."
      );
    }

    return normalizeConfirmResult(result);
  } catch (err) {
    if (err instanceof QuarantinedFileError) throw err;
    if (isFileQuarantined(err)) {
      throw new QuarantinedFileError(
        err?.response?.data?.message ||
          err?.message ||
          "This file was blocked by security scanning and cannot be attached."
      );
    }
    throw err;
  }
}

/**
 * Build H-10 / H-07 presign payload (always includes fileSizeBytes).
 * entityId is omitted when empty (misc / new draft folder).
 * @param {File} file
 * @param {string} [entityId]
 * @returns {{
 *   fileName: string,
 *   contentType: string,
 *   fileSizeBytes: number,
 *   entityId?: string,
 * }}
 */
export function buildPresignPayload(file, entityId) {
  const contentType = normalizeUploadContentType(
    file?.type || "application/octet-stream"
  );
  const payload = {
    fileName: ensureUploadFileName(file?.name || "file", contentType),
    contentType,
    fileSizeBytes: Number(file?.size) || 0,
  };
  const id = entityId != null ? String(entityId).trim() : "";
  if (id) payload.entityId = id;
  return payload;
}

/**
 * @param {unknown} presign
 * @returns {{ uploadUrl: string, fileUrl: string, key: string, uploadHeaders?: Record<string, string> }}
 */
function normalizePresignResponse(presign) {
  const body = presign?.data ?? presign ?? {};
  const uploadUrl =
    body.signedUploadUrl || body.uploadUrl || body.url || body.putUrl;
  const fileUrl = body.fileUrl || body.publicUrl || body.readUrl;
  const key = body.key || body.s3Key;
  const uploadHeaders = body.uploadHeaders || body.headers || undefined;

  if (!uploadUrl || !fileUrl) {
    throw new Error(
      "Invalid presigned response: missing signedUploadUrl/uploadUrl or fileUrl"
    );
  }
  if (!key) {
    throw new Error("Invalid presigned response: missing key");
  }

  return { uploadUrl, fileUrl, key, uploadHeaders };
}

/**
 * Upload image to S3 via backend presigned URL, then confirm (H-10).
 * Requires Bearer JWT. Attach returned fileUrl/key only after this resolves
 * (objects are private until confirm succeeds).
 * @param {File} file - Image file
 * @param {string} [entityId] - Order id you own/are assigned, or omit for misc
 * @returns {Promise<{ fileUrl: string, key: string }>}
 */
export async function uploadImageToS3(file, entityId) {
  assertUploadAuth();
  const payload = buildPresignPayload(file, entityId);
  const { uploadUrl, fileUrl, key, uploadHeaders } = normalizePresignResponse(
    await getImagePresignedUrl(payload)
  );
  const putHeaders = buildS3PutHeaders(file, uploadHeaders);
  await putFileToS3(uploadUrl, file, uploadHeaders);
  const confirmed = await confirmUploadedFile({
    key,
    contentType: contentTypeFromPutHeaders(putHeaders, payload.contentType),
    fileName: payload.fileName,
    fileSizeBytes: payload.fileSizeBytes,
  });
  return { fileUrl: confirmed.fileUrl || fileUrl, key: confirmed.key || key };
}

/**
 * Upload audio to S3 via backend presigned URL, then confirm (H-10).
 * Prefer `toVoiceNoteFile(blob)` for MediaRecorder notes so contentType has no `;codecs=`.
 * @param {File} file - Audio file
 * @param {string} [entityId] - Order id you own/are assigned, or omit for misc
 * @returns {Promise<{ fileUrl: string, key: string }>}
 */
export async function uploadAudioToS3(file, entityId) {
  assertUploadAuth();
  const payload = buildPresignPayload(file, entityId);
  const { uploadUrl, fileUrl, key, uploadHeaders } = normalizePresignResponse(
    await getAudioPresignedUrl(payload)
  );
  const putHeaders = buildS3PutHeaders(file, uploadHeaders);
  await putFileToS3(uploadUrl, file, uploadHeaders);
  const confirmed = await confirmUploadedFile({
    key,
    contentType: contentTypeFromPutHeaders(putHeaders, payload.contentType),
    fileName: payload.fileName,
    fileSizeBytes: payload.fileSizeBytes,
  });
  return { fileUrl: confirmed.fileUrl || fileUrl, key: confirmed.key || key };
}

/**
 * Split a File into consecutive Blob parts for multipart upload.
 * @param {File} file
 * @param {number} partSize
 * @returns {Blob[]}
 */
function splitFileIntoParts(file, partSize) {
  const size = Number(file.size) || 0;
  const chunks = [];
  let offset = 0;
  while (offset < size) {
    const end = Math.min(offset + partSize, size);
    chunks.push(file.slice(offset, end));
    offset = end;
  }
  return chunks.length ? chunks : [file.slice(0, 0)];
}

/**
 * Large-file path: multipart start → part PUTs → complete (confirm).
 * @param {File} file
 * @param {string} entityId
 * @param {"source" | "preview"} role
 * @param {string} contentType
 */
async function uploadCadDeliverableMultipart(file, entityId, role, contentType) {
  const fileSizeBytes = Number(file.size) || 0;
  const start = await startCadDeliverableMultipart({
    fileName: file.name,
    contentType,
    fileSizeBytes,
    role,
    entityId,
  });
  const startBody = start?.data ?? start ?? {};
  const uploadId = startBody.uploadId || startBody.multipartUploadId;
  const key = startBody.key || startBody.s3Key;
  const fileUrlFromStart = startBody.fileUrl || startBody.url;
  const partSize =
    Number(startBody.partSizeBytes) || CAD_DELIVERABLE_PART_SIZE_BYTES;

  if (!uploadId || !key) {
    throw new Error(
      "Invalid multipart start response: missing uploadId or key"
    );
  }

  const parts = splitFileIntoParts(file, partSize);
  const completedParts = [];

  for (let i = 0; i < parts.length; i += 1) {
    const partNumber = i + 1;
    const partMeta = await getCadDeliverableMultipartPart({
      uploadId,
      key,
      partNumber,
      contentType,
    });
    const partBody = partMeta?.data ?? partMeta ?? {};
    const uploadUrl =
      partBody.signedUploadUrl || partBody.uploadUrl || partBody.url;
    const uploadHeaders = partBody.uploadHeaders || partBody.headers;
    if (!uploadUrl) {
      throw new Error(
        `Invalid multipart part response for part ${partNumber}: missing signedUploadUrl`
      );
    }

    const { etag } = await putFileToS3(uploadUrl, parts[i], uploadHeaders);
    if (!etag) {
      throw new Error(
        `S3 multipart part ${partNumber} succeeded but ETag was missing`
      );
    }
    completedParts.push({ partNumber, etag, ETag: etag });
  }

  const complete = await completeCadDeliverableMultipart({
    uploadId,
    key,
    fileName: file.name,
    contentType,
    fileSizeBytes,
    role,
    parts: completedParts,
  });

  const confirmed = normalizeConfirmResult(complete);
  if (!confirmed.confirmed) {
    throw new Error(
      "CAD deliverable multipart complete did not return confirmed=true"
    );
  }

  return {
    fileUrl: confirmed.fileUrl || fileUrlFromStart,
    key: confirmed.key || key,
    sha256: confirmed.sha256,
    confirmed: true,
    role,
    fileName: file.name,
    mimeType: contentType,
    size: fileSizeBytes,
  };
}

/**
 * Single-PUT path: cad-deliverable presign → PUT → confirm.
 * @param {File} file
 * @param {string} entityId
 * @param {"source" | "preview"} role
 * @param {string} contentType
 */
async function uploadCadDeliverableSingle(file, entityId, role, contentType) {
  const fileSizeBytes = Number(file.size) || 0;
  const presign = await getCadDeliverablePresignedUrl({
    fileName: file.name,
    contentType,
    fileSizeBytes,
    role,
    entityId,
  });
  const { uploadUrl, fileUrl, key, uploadHeaders } =
    normalizePresignResponse(presign);

  await putFileToS3(uploadUrl, file, uploadHeaders);

  const confirmed = await confirmUploadedFile({
    key,
    contentType,
    fileName: file.name,
    fileSizeBytes,
  });

  if (!confirmed.confirmed && !confirmed.sha256) {
    throw new Error("CAD deliverable confirm did not return confirmed/sha256");
  }

  return {
    fileUrl: confirmed.fileUrl || fileUrl,
    key: confirmed.key || key,
    sha256: confirmed.sha256,
    confirmed: true,
    role,
    fileName: file.name,
    mimeType: contentType,
    size: fileSizeBytes,
  };
}

/**
 * H-12: upload a CAD deliverable via /api/upload/cad-deliverable (not /image).
 * Uses multipart when file size ≥ threshold.
 *
 * @param {File} file
 * @param {string} entityId - assignment or sketch upload id
 * @param {{ role?: "source" | "preview" }} [options]
 * @returns {Promise<{
 *   fileUrl: string,
 *   key: string,
 *   sha256?: string,
 *   confirmed: boolean,
 *   role: "source" | "preview",
 *   fileName: string,
 *   mimeType: string,
 *   size: number,
 * }>}
 */
export async function uploadCadDeliverableToS3(file, entityId, options = {}) {
  assertUploadAuth();
  const role = options.role || resolveCadDeliverableRole(file);
  if (role !== "source" && role !== "preview") {
    throw new Error(
      "CAD deliverable must be a .dwg/.dxf source or .pdf/image preview"
    );
  }
  if (!entityId) {
    throw new Error("CAD deliverable upload requires entityId");
  }

  const contentType = resolveCadDeliverableContentType(file);
  const size = Number(file.size) || 0;

  if (size >= CAD_DELIVERABLE_MULTIPART_THRESHOLD_BYTES) {
    return uploadCadDeliverableMultipart(file, entityId, role, contentType);
  }
  return uploadCadDeliverableSingle(file, entityId, role, contentType);
}

/**
 * Delete a file from S3 via backend (backend handles S3 delete).
 * @param {{ fileUrl: string }} params
 * @returns {Promise<unknown>}
 */
export async function deleteFileFromS3({ fileUrl }) {
  return deleteUploadedFile({ fileUrl });
}

export {
  QuarantinedFileError,
  UploadAuthRequiredError,
  isFileQuarantined,
  getUploadErrorMessage,
  getUploadErrorCode,
} from "./upload.errors.js";
export {
  resolveCadDeliverableRole,
  resolveCadDeliverableContentType,
  validateCadDeliverableFiles,
  toCadDeliverFilePayload,
} from "./cadDeliverable.utils.js";
