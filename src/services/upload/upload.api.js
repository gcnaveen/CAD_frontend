import apiClient from "../apiClient";
import { getStoredAccessToken } from "../../utils/authToken.js";
import { UploadAuthRequiredError } from "./upload.errors.js";

const UPLOAD_BASE = "/api/upload";

/**
 * H-07 / H-10: upload endpoints require Bearer when UPLOAD_REQUIRE_AUTH=true.
 * Uses apiClient interceptor + explicit Authorization so accessToken is never dropped.
 */

function unwrap(data) {
  return data?.data ?? data;
}

/**
 * Axios config that always sends Authorization: Bearer <accessToken>.
 * @returns {{ headers: { Authorization: string } }}
 */
function bearerConfig() {
  const token = getStoredAccessToken();
  if (!token) {
    throw new UploadAuthRequiredError();
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * Get presigned URL for image upload (H-10: Bearer required).
 * POST /api/upload/image
 * @param {{
 *   fileName: string,
 *   contentType?: string,
 *   fileSizeBytes: number,
 *   entityId?: string,
 *   files?: Array<{ fileName: string, contentType?: string, fileSizeBytes: number }>,
 * }} payload
 * @returns {Promise<{ signedUploadUrl?: string, uploadUrl?: string, uploadHeaders?: Record<string, string>, fileUrl: string, key: string }>}
 */
export async function getImagePresignedUrl(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/image`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * Get presigned URL for audio upload (H-10: Bearer required).
 * POST /api/upload/audio
 * Prefer base MIME without `;codecs=` (e.g. audio/webm).
 * @param {{
 *   fileName: string,
 *   contentType?: string,
 *   fileSizeBytes: number,
 *   entityId?: string,
 *   files?: Array<{ fileName: string, contentType?: string, fileSizeBytes: number }>,
 * }} payload
 * @returns {Promise<{ signedUploadUrl?: string, uploadUrl?: string, uploadHeaders?: Record<string, string>, fileUrl: string, key: string }>}
 */
export async function getAudioPresignedUrl(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/audio`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * H-12: presign CAD deliverable (.dwg/.dxf source or optional preview).
 * Do not use /api/upload/image for final CAD deliverables.
 * POST /api/upload/cad-deliverable
 * @param {{
 *   fileName: string,
 *   contentType: string,
 *   fileSizeBytes: number,
 *   role: "source" | "preview",
 *   entityId: string,
 * }} payload
 * @returns {Promise<{
 *   signedUploadUrl?: string,
 *   uploadUrl?: string,
 *   uploadHeaders?: Record<string, string>,
 *   fileUrl: string,
 *   key: string,
 * }>}
 */
export async function getCadDeliverablePresignedUrl(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/cad-deliverable`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * H-12: start multipart CAD deliverable upload for large files.
 * POST /api/upload/cad-deliverable/multipart/start
 */
export async function startCadDeliverableMultipart(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/cad-deliverable/multipart/start`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * H-12: get signed URL for one multipart part.
 * POST /api/upload/cad-deliverable/multipart/part
 */
export async function getCadDeliverableMultipartPart(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/cad-deliverable/multipart/part`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * H-12: complete multipart upload (backend runs confirm).
 * POST /api/upload/cad-deliverable/multipart/complete
 */
export async function completeCadDeliverableMultipart(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/cad-deliverable/multipart/complete`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * Confirm upload after successful S3 PUT (H-10 / H-07 scanning / finalize).
 * Requires the same Bearer JWT as presign. Do not attach fileUrl until this succeeds.
 * POST /api/upload/confirm
 * @param {{ key: string, contentType: string, fileName: string, fileSizeBytes?: number }} payload
 * @returns {Promise<{ confirmed?: boolean, sha256?: string, [key: string]: unknown }>}
 */
export async function confirmUpload(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/confirm`,
    payload,
    bearerConfig()
  );
  return unwrap(data);
}

/**
 * Delete an uploaded file from S3 (backend invalidates/removes by fileUrl or key).
 * POST /api/upload/delete
 * @param {{ fileUrl?: string, key?: string }} payload
 * @returns {Promise<unknown>}
 */
export async function deleteUploadedFile(payload) {
  const { data } = await apiClient.post(
    `${UPLOAD_BASE}/delete`,
    payload,
    bearerConfig()
  );
  return data;
}
